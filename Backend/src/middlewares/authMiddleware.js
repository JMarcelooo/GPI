const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { estaRevogado } = require('../services/revogacaoService');

function assinarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, role: usuario.role, jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Prioriza o cookie httpOnly (navegador) e aceita o header Authorization
// (clientes não-navegador / testes / APIs) como fallback.
function extrairToken(req) {
  if (req.cookies && req.cookies.gpi_token) {
    return req.cookies.gpi_token;
  }
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function autenticar(req, res, next) {
  const token = extrairToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (await estaRevogado(payload.jti)) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
    req.usuario = { id: payload.id, role: payload.role };
    req.jti = payload.jti;
    req.tokenExp = payload.exp;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

function exigirAdmin(req, res, next) {
  if (!req.usuario || req.usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { autenticar, exigirAdmin, assinarToken };
