const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notificacao = sequelize.define('Notificacao', {
  // Null para notificações que não vêm de pagamento (ex.: tipo 'rpi').
  pagamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  // Número da edição da RPI que gerou a notificação (tipo 'rpi').
  // Dedupe garantido pelo índice único parcial uq_notificacao_rpi.
  rpi_numero: {
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
