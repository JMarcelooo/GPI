const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 1 notificação por evento (pagamento ou edição da RPI), compartilhada
// entre todos os usuários. A leitura é global: quem marcou como lida fica
// registrado em lida_por_id/lida_por_nome/lida_em.
const Notificacao = sequelize.define('Notificacao', {
  // Null para notificações que não vêm de pagamento (ex.: tipo 'rpi').
  pagamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: 'uq_notificacao_pagamento'
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
  },
  // Quem marcou como lida (null enquanto não lida).
  lida_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lida_por_nome: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  lida_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notificacoes',
  timestamps: true
});

module.exports = Notificacao;
