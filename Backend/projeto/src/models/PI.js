const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PI = sequelize.define('PI', {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  protocolo: {
    type: DataTypes.STRING,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pendente'
  }
}, {
  timestamps: true  // Cria campos createdAt/updatedAt automaticamente
});

module.exports = PI;