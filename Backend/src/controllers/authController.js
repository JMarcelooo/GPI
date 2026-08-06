const bcrypt = require('bcryptjs');
const { User } = require('../models/index');
const { assinarToken } = require('../middlewares/authMiddleware');

function sanitizeUser(user) {
  const plain = user.get({ plain: true });
  delete plain.senha;
  return plain;
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      error: 'Informe e-mail e senha.'
    });
  }

  try {
    const usuario = await User.findOne({ where: { email: String(email).toLowerCase().trim() } });

    if (!usuario || !(await bcrypt.compare(String(senha), usuario.senha))) {
      return res.status(401).json({
        error: 'E-mail ou senha incorretos.'
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        error: 'Conta desativada. Fale com o administrador.'
      });
    }

    const token = assinarToken(usuario);
    res.json({
      token,
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
    usuario.deveTrocarSenha = false;
    await usuario.save();

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};
