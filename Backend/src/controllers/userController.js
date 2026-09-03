const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, PasswordToken } = require('../models/index');
const { sincronizarNotificacoes } = require('../services/notificacaoService');
const { registrarHistorico } = require('../services/historicoService');
const { enviarConvite, hashToken } = require('../services/emailService');

const ROLES_VALIDOS = ['admin', 'usuario'];

function sanitizeUser(user) {
  const plain = user.get({ plain: true });
  delete plain.senha;
  return plain;
}

function handleError(error, res, label) {
  console.error(`Erro ao ${label}:`, error);
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors?.[0]?.path || '';
    if (String(field).includes('username')) {
      return res.status(409).json({ error: 'Já existe um usuário com este username.' });
    }
    return res.status(409).json({
      error: 'Já existe um usuário com este e-mail.'
    });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      errors: error.errors.map(e => e.message)
    });
  }
  res.status(500).json({
    error: `Erro ao ${label}.`
  });
}

// GET /api/usuarios
exports.listUsuarios = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'nome', 'username', 'email', 'role', 'ativo', 'deveTrocarSenha', 'createdAt', 'updatedAt'],
      order: [['nome', 'ASC']]
    });
    res.json({ data: usuarios });
  } catch (error) {
    handleError(error, res, 'listar usuários');
  }
};

// POST /api/usuarios — cria usuário e envia convite por e-mail (sem senhaInicial)
exports.createUsuario = async (req, res) => {
  const { nome, email, username: usernameRaw, senhaInicial } = req.body;
  // BUG-012: role sempre forçada para 'usuario' — quem cria define a role,
  // mas somente admin (já garantido pelo middleware exigirAdmin na rota)
  // pode atribuir 'admin' depois via update.
  const role = 'usuario';

  if (!nome || !email) {
    return res.status(400).json({
      error: 'Nome e e-mail são obrigatórios.'
    });
  }
  if (role && !ROLES_VALIDOS.includes(role)) {
    return res.status(400).json({
      error: 'Role inválida. Use "admin" ou "usuario".'
    });
  }

  // Normaliza/valida username (gerado a partir do nome se não fornecido)
  let username = usernameRaw ? String(usernameRaw).toLowerCase().trim() : '';
  if (!username) {
    const base = String(nome).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20) || 'user';
    let candidate = base;
    let suffix = 0;
    while (await User.findOne({ where: { username: candidate } })) {
      suffix += 1;
      candidate = `${base}${suffix}`.slice(0, 30);
      if (suffix > 100) break;
    }
    username = candidate;
  }
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'Username deve ter 3-30 caracteres (letras, números, ponto, sublinhado).' });
  }
  const existente = await User.findOne({ where: { username } });
  if (existente) {
    return res.status(409).json({ error: 'Já existe um usuário com este username.' });
  }

  // Compatibilidade: se senhaInicial ainda vier (tests antigos), mantém fluxo legado
  const usarLegado = senhaInicial !== undefined && senhaInicial !== null && String(senhaInicial) !== '';
  if (usarLegado && String(senhaInicial).length < 6) {
    return res.status(400).json({
      error: 'A senha inicial deve ter no mínimo 6 caracteres.'
    });
  }

  try {
    let novoUsuario;
    if (usarLegado) {
      const senhaHash = await bcrypt.hash(String(senhaInicial), 10);
      novoUsuario = await User.create({
        nome,
        username,
        email: String(email).toLowerCase().trim(),
        role,
        senha: senhaHash,
        deveTrocarSenha: true
      });
    } else {
      novoUsuario = await User.create({
        nome,
        username,
        email: String(email).toLowerCase().trim(),
        role,
        senha: null,
        deveTrocarSenha: true
      });
    }

    // Fluxo novo: envia convite por e-mail com link para definir senha (sem senhaInicial)
    if (!usarLegado) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      await PasswordToken.create({
        user_id: novoUsuario.id,
        tipo: 'convite',
        token_hash: tokenHash,
        expira_em: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
      enviarConvite({ email: novoUsuario.email, nome: novoUsuario.nome, username: novoUsuario.username, token: rawToken }).catch(e => console.error('Falha ao enviar convite:', e.message));
    }
    // Gera as cópias de notificações para o novo usuário.
    await sincronizarNotificacoes(true);
    await registrarHistorico({
      tipo: 'usuario',
      acao: 'criacao',
      descricao: `Usuário "${novoUsuario.nome}" criado (${novoUsuario.role})`,
      detalhes: { email: novoUsuario.email, role: novoUsuario.role },
      usuario: req.usuario
    });
    res.status(201).json({ data: sanitizeUser(novoUsuario) });
  } catch (error) {
    handleError(error, res, 'criar usuário');
  }
};

// PUT /api/usuarios/:id
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, ativo, novaSenha } = req.body;
  // BUG-012: role controlada separadamente — só admin pode alterar.
  const role = req.usuario.role === 'admin' ? req.body.role : undefined;

  try {
    const usuario = await User.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const ativoOriginal = usuario.ativo;

    if (role && !ROLES_VALIDOS.includes(role)) {
      return res.status(400).json({
        error: 'Role inválida. Use "admin" ou "usuario".'
      });
    }

    if (usuario.id === req.usuario?.id) {
      if (ativo === false) {
        return res.status(400).json({
          error: 'Você não pode desativar a própria conta.'
        });
      }
      if (role && role !== usuario.role && role === 'usuario') {
        return res.status(400).json({
          error: 'Você não pode remover o próprio papel de admin.'
        });
      }
    }

    if (novaSenha !== undefined) {
      if (String(novaSenha).length < 6) {
        return res.status(400).json({
          error: 'A nova senha deve ter no mínimo 6 caracteres.'
        });
      }
      usuario.senha = await bcrypt.hash(novaSenha, 10);
      usuario.deveTrocarSenha = true;
    }

    // Mudanças computadas antes de mutar o registro.
    const mudancas = [];
    if (nome !== undefined && nome !== usuario.nome) mudancas.push(`nome → "${nome}"`);
    if (role !== undefined && role !== usuario.role) mudancas.push(`papel → ${role}`);
    if (ativo !== undefined && ativo !== usuario.ativo) mudancas.push(ativo ? 'ativado' : 'desativado');
    if (novaSenha !== undefined) mudancas.push('senha redefinida');

    if (nome !== undefined) usuario.nome = nome;
    if (role !== undefined) usuario.role = role;
    if (ativo !== undefined) usuario.ativo = ativo;

    await usuario.save();
    // Apenas (des)ativação afeta o conjunto de notificações visíveis; nesses
    // casos reexecuta a sincronização aguardando o término (sem fire-and-forget).
    if (ativo !== undefined && ativo !== ativoOriginal) {
      await sincronizarNotificacoes(true);
    }
    if (mudancas.length > 0) {
      await registrarHistorico({
        tipo: 'usuario',
        acao: 'atualizacao',
        descricao: `Usuário "${usuario.nome}" atualizado — ${mudancas.join(', ')}`,
        detalhes: { email: usuario.email, alteracoes: mudancas },
        usuario: req.usuario
      });
    }
    res.json({ data: sanitizeUser(usuario) });
  } catch (error) {
    handleError(error, res, 'atualizar usuário');
  }
};

// DELETE /api/usuarios/:id
exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    if (String(id) === String(req.usuario?.id)) {
      return res.status(400).json({
        error: 'Você não pode excluir a própria conta.'
      });
    }

    const usuario = await User.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await registrarHistorico({
      tipo: 'usuario',
      acao: 'exclusao',
      descricao: `Usuário "${usuario.nome}" excluído`,
      detalhes: { email: usuario.email, role: usuario.role },
      usuario: req.usuario
    });
    await usuario.destroy();
    res.status(200).json({ message: 'Usuário removido com sucesso.' });
  } catch (error) {
    handleError(error, res, 'excluir usuário');
  }
};
