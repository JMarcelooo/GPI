const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PI = sequelize.define('PI', {
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['patente de invencao', 'modelo de utilidade', 'marca', 'programa de computador']]
    }
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  depositante: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  parceiro: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  titular: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'em analise',
    validate: {
      isIn: [['indeferida', 'anulada', 'arquivada', 'em analise', 'deferida', 'registrada', 'carta patente']]
    }
  },
  protocolo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  data_entrada: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  termo_cessao: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'pi',
  timestamps: true
});

module.exports = PI;
