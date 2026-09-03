const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, PasswordToken } = require('../models/index');
const { assinarToken } = require('../middlewares/authMiddleware');
const { revogar } = require('../services/revogacaoService');
const { registrarHistorico } = require('../services/historicoService');
const { enviarCodigoReset, hashToken } = require('../services/emailService');

function sanitizeUser(user) {
  const plain = user.get({ plain: true });
  delete plain.senha;
  return plain;
}

// O protocolo real vem em x-forwarded-proto quando há proxy reverso (nginx)
// terminando o TLS: o Node enxerga HTTP, mas o navegador está em HTTPS.
// Nesse caso o cookie precisa de Secure + SameSite=None para ser enviado em
// requisições cross-site com credentials. Se for HTTP (dev), usa Lax.
function cookieOptions(req) {
  const isHttps = req && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  return {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  };
}

// POST /api/auth/login — aceita username ou e-mail (T1)
exports.login = async (req, res) => {
  const { email, username, identificador, senha } = req.body;
  const loginRaw = String(identificador || username || email || '').trim();

  if (!loginRaw || !senha) {
    return res.status(400).json({
      error: 'Informe usuário (username ou e-mail) e senha.'
    });
  }

  try {
    const isEmail = loginRaw.includes('@');
    const where = isEmail
      ? { email: loginRaw.toLowerCase() }
      : { username: loginRaw.toLowerCase() };
    // Fallback: se buscou por username e não achou, tenta e-mail (compatibilidade)
    let usuario = await User.findOne({ where });
    if (!usuario && !isEmail) {
      usuario = await User.findOne({ where: { email: loginRaw.toLowerCase() } });
    }
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    if (!usuario.senha) {
      return res.status(401).json({ error: 'Conta ainda não ativada. Verifique seu e-mail para definir a senha.' });
    }
    if (!(await bcrypt.compare(String(senha), usuario.senha))) {
      return res.status(401).json({
        error: 'Usuário ou senha incorretos.'
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        error: 'Conta desativada. Fale com o administrador.'
      });
    }

    const token = assinarToken(usuario);
    // BUG-006/BUG-002: token exclusivamente em cookie httpOnly (ilegível via
    // JS → mitiga XSS). Não retornamos no body JSON para evitar exposição.
    res.cookie('gpi_token', token, cookieOptions(req));
    res.json({
      user: sanitizeUser(usuario)
    });
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    res.status(500).json({ error: 'Erro ao autenticar.' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id);
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Usuário não encontrado ou desativado.' });
    }
    res.json({ user: sanitizeUser(usuario) });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
};

// POST /api/auth/alterar-senha
exports.alterarSenha = async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!novaSenha) {
    return res.status(400).json({
      error: 'Informe a nova senha.'
    });
  }
  if (String(novaSenha).length < 6) {
    return res.status(400).json({
      error: 'A nova senha deve ter no mínimo 6 caracteres.'
    });
  }

  try {
    const usuario = await User.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // No primeiro acesso (deveTrocarSenha) a senha atual é opcional;
    // nas trocas voluntárias ela é obrigatória.
    const precisaSenhaAtual = !usuario.deveTrocarSenha || senhaAtual;
    if (precisaSenhaAtual) {
      if (!senhaAtual) {
        return res.status(400).json({
          error: 'Informe a senha atual.'
        });
      }
      const confere = await bcrypt.compare(String(senhaAtual), usuario.senha);
      if (!confere) {
        return res.status(401).json({ error: 'Senha atual incorreta.' });
      }
    }

    usuario.senha = await bcrypt.hash(String(novaSenha), 10);
    const primeiraTroca = Boolean(usuario.deveTrocarSenha);
    usuario.deveTrocarSenha = false;
    await usuario.save();

    await registrarHistorico({
      tipo: 'usuario',
      acao: 'atualizacao',
      descricao: `Usuário "${usuario.nome}" ${primeiraTroca ? 'realizou a troca de senha inicial' : 'alterou a própria senha'}`,
      usuario: req.usuario
    });

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};

// POST /api/auth/ativar — define senha inicial via token de convite (público)
exports.ativarConta = async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  if (String(novaSenha).length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
  try {
    const tokenHash = hashToken(token);
    const registro = await PasswordToken.findOne({ where: { token_hash: tokenHash, tipo: 'convite', usado_em: null } });
    if (!registro) return res.status(400).json({ error: 'Token inválido ou já utilizado.' });
    if (new Date(registro.expira_em) < new Date()) return res.status(400).json({ error: 'Token expirado. Solicite novo convite ao administrador.' });
    const usuario = await User.findByPk(registro.user_id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    usuario.senha = await bcrypt.hash(String(novaSenha), 10);
    usuario.deveTrocarSenha = false;
    await usuario.save();
    registro.usado_em = new Date();
    await registro.save();
    await registrarHistorico({ tipo: 'usuario', acao: 'atualizacao', descricao: `Usuário "${usuario.nome}" ativou a conta via convite`, usuario });
    return res.json({ message: 'Conta ativada com sucesso. Faça login.' });
  } catch (err) {
    console.error('Erro ao ativar conta:', err);
    return res.status(500).json({ error: 'Erro ao ativar conta.' });
  }
};

// POST /api/auth/esqueci — solicita código por e-mail (público, sempre 200)
exports.solicitarReset = async (req, res) => {
  const { email, username, identificador } = req.body;
  const raw = String(identificador || email || username || '').trim();
  try {
    if (!raw) return res.json({ message: 'Se o e-mail/usuário existir, um código foi enviado.' });
    const isEmail = raw.includes('@');
    let usuario = null;
    if (isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    else usuario = await User.findOne({ where: { username: raw.toLowerCase() } });
    if (!usuario && !isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    if (!usuario || !usuario.email) {
      return res.json({ message: 'Se o e-mail/usuário existir, um código foi enviado.' });
    }
    // Invalida códigos anteriores pendentes
    await PasswordToken.update({ usado_em: new Date() }, { where: { user_id: usuario.id, tipo: 'reset_codigo', usado_em: null } });
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const codigoHash = await bcrypt.hash(codigo, 10);
    await PasswordToken.create({
      user_id: usuario.id,
      tipo: 'reset_codigo',
      codigo_hash: codigoHash,
      expira_em: new Date(Date.now() + 15 * 60 * 1000)
    });
    enviarCodigoReset({ email: usuario.email, nome: usuario.nome, codigo }).catch(e => console.error('Falha ao enviar código:', e.message));
    return res.json({ message: 'Se o e-mail/usuário existir, um código foi enviado.' });
  } catch (err) {
    console.error('Erro ao solicitar reset:', err);
    return res.json({ message: 'Se o e-mail/usuário existir, um código foi enviado.' });
  }
};

// POST /api/auth/verificar-codigo
exports.verificarCodigo = async (req, res) => {
  const { email, username, identificador, codigo } = req.body;
  const raw = String(identificador || email || username || '').trim();
  if (!raw || !codigo) return res.status(400).json({ error: 'Informe e-mail/usuário e código.' });
  try {
    const isEmail = raw.includes('@');
    let usuario = null;
    if (isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    else usuario = await User.findOne({ where: { username: raw.toLowerCase() } });
    if (!usuario && !isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    if (!usuario) return res.status(400).json({ error: 'Código inválido.' });
    const registro = await PasswordToken.findOne({
      where: { user_id: usuario.id, tipo: 'reset_codigo', usado_em: null, expira_em: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']]
    });
    if (!registro || !registro.codigo_hash) return res.status(400).json({ error: 'Código inválido ou expirado.' });
    const ok = await bcrypt.compare(String(codigo), registro.codigo_hash);
    if (!ok) return res.status(400).json({ error: 'Código inválido.' });
    return res.json({ message: 'Código válido.' });
  } catch (err) {
    console.error('Erro ao verificar código:', err);
    return res.status(500).json({ error: 'Erro ao verificar código.' });
  }
};

// POST /api/auth/redefinir — com código
exports.redefinirSenha = async (req, res) => {
  const { email, username, identificador, codigo, novaSenha } = req.body;
  const raw = String(identificador || email || username || '').trim();
  if (!raw || !codigo || !novaSenha) return res.status(400).json({ error: 'Informe e-mail/usuário, código e nova senha.' });
  if (String(novaSenha).length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
  try {
    const isEmail = raw.includes('@');
    let usuario = null;
    if (isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    else usuario = await User.findOne({ where: { username: raw.toLowerCase() } });
    if (!usuario && !isEmail) usuario = await User.findOne({ where: { email: raw.toLowerCase() } });
    if (!usuario) return res.status(400).json({ error: 'Código inválido.' });
    const registro = await PasswordToken.findOne({
      where: { user_id: usuario.id, tipo: 'reset_codigo', usado_em: null, expira_em: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']]
    });
    if (!registro || !registro.codigo_hash) return res.status(400).json({ error: 'Código inválido ou expirado.' });
    const ok = await bcrypt.compare(String(codigo), registro.codigo_hash);
    if (!ok) return res.status(400).json({ error: 'Código inválido.' });
    usuario.senha = await bcrypt.hash(String(novaSenha), 10);
    usuario.deveTrocarSenha = false;
    await usuario.save();
    registro.usado_em = new Date();
    await registro.save();
    await PasswordToken.update({ usado_em: new Date() }, { where: { user_id: usuario.id, tipo: 'reset_codigo', usado_em: null } });
    await registrarHistorico({ tipo: 'usuario', acao: 'atualizacao', descricao: `Usuário "${usuario.nome}" redefiniu a senha via código`, usuario });
    return res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

// PUT /api/auth/me — atualiza username/nome do próprio usuário (autenticado)
exports.atualizarMeuPerfil = async (req, res) => {
  const { username: usernameRaw, nome } = req.body;
  try {
    const usuario = await User.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const mudancas = [];
    if (usernameRaw !== undefined) {
      const username = String(usernameRaw).toLowerCase().trim();
      if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
        return res.status(400).json({ error: 'Username deve ter 3-30 caracteres (letras, números, ponto, sublinhado).' });
      }
      if (username !== usuario.username) {
        const existe = await User.findOne({ where: { username } });
        if (existe) return res.status(409).json({ error: 'Username já em uso.' });
        mudancas.push(`username → ${username}`);
        usuario.username = username;
      }
    }
    if (nome !== undefined && String(nome).trim() && String(nome).trim() !== usuario.nome) {
      mudancas.push(`nome → "${String(nome).trim()}"`);
      usuario.nome = String(nome).trim();
    }
    if (mudancas.length === 0) return res.json({ user: sanitizeUser(usuario) });
    await usuario.save();
    await registrarHistorico({ tipo: 'usuario', acao: 'atualizacao', descricao: `Usuário "${usuario.nome}" atualizou perfil — ${mudancas.join(', ')}`, usuario });
    return res.json({ user: sanitizeUser(usuario) });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Username já em uso.' });
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // Revoga o jti atual (blacklist) para que o token não seja reaproveitado.
    await revogar(req.jti, req.tokenExp);
    res.clearCookie('gpi_token', cookieOptions(req));
    res.json({ message: 'Logout realizado.' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout.' });
  }
};
