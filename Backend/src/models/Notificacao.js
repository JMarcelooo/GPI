const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notificacao = sequelize.define('Notificacao', {
  pagamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'uq_notificacao_pagamento_usuario'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'uq_notificacao_pagamento_usuario'
  },
  pi_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'prazo'
  },
  mensagem: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  data_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'notificacoes',
  timestamps: true
});

module.exports = Notificacao;
