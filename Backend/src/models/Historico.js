const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Historico = sequelize.define('Historico', {
  pi_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  acao: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  detalhes: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'historico',
  timestamps: true
});

module.exports = Historico;
