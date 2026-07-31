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
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  observacao: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'pagamentos',
  timestamps: false
});

module.exports = Pagamento;
