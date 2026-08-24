const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RpiEdicao = sequelize.define('RpiEdicao', {
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  data_publicacao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  processada_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'rpi_edicoes',
  timestamps: false
});

module.exports = RpiEdicao;
