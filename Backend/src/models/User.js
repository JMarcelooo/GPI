const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
    validate: {
      len: { args: [3, 30], msg: 'Username deve ter entre 3 e 30 caracteres' },
      is: { args: /^[a-z0-9_.]+$/i, msg: 'Username só pode conter letras, números, ponto e sublinhado' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'E-mail inválido' }
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'usuario'),
    allowNull: false,
    defaultValue: 'usuario'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  deveTrocarSenha: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = User;
