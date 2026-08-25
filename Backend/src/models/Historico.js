const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Historico = sequelize.define('Historico', {
  // Null para eventos que não pertencem a uma PI (ex.: autores, usuários).
  pi_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_nome: {
    type: DataTypes.STRING(150),
    allowNull: true
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
