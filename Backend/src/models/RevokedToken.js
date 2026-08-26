const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Tabela de revogação de tokens (blacklist). O JWT carrega um `jti` único;
// no logout esse jti é inserido aqui e o middleware rejeita qualquer
// token cujo jti esteja presente, tornando o token inválido antes de expirar.
const RevokedToken = sequelize.define('RevokedToken', {
  jti: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  expiraEm: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'token_blacklist',
  timestamps: false
});

module.exports = RevokedToken;
