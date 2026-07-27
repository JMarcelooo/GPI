const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RPI = sequelize.define('RPI', {
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  pi_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  codigo_evento: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  descricao_do_evento: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'RPI',
  timestamps: false
});

module.exports = RPI;
