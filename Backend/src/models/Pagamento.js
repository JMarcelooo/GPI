const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pagamento = sequelize.define('Pagamento', {
  pi_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_de_pagamento: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  data_de_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_informada: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'aguardando prazo'
  },
  prazo_dias: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processo_sei: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'pagamentos',
  timestamps: false
});

module.exports = Pagamento;
