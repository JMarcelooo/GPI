const { RevokedToken } = require('../models');
const { Op } = require('sequelize');

// Revoga um token inserindo seu `jti` na blacklist. Opcionalmente_remove
// entradas já expiradas para evitar crescimento indefinido da tabela.
async function revogar(jti, exp) {
  if (!jti) return;
  const expiraEm = exp ? new Date(exp * 1000) : null;
  await RevokedToken.findOrCreate({ where: { jti }, defaults: { expiraEm } });
  await RevokedToken.destroy({ where: { expiraEm: { [Op.lt]: new Date() } } }).catch(() => {});
}

async function estaRevogado(jti) {
  if (!jti) return false;
  const found = await RevokedToken.findByPk(jti);
  return !!found;
}

module.exports = { revogar, estaRevogado };
