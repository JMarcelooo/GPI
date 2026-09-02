const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PasswordToken = sequelize.define('PasswordToken', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  tipo: {
    type: DataTypes.ENUM('convite', 'reset_codigo'),
    allowNull: false
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  codigo_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  expira_em: {
    type: DataTypes.DATE,
    allowNull: false
  },
  usado_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'password_tokens',
  timestamps: true,
  updatedAt: false
});

module.exports = PasswordToken;
