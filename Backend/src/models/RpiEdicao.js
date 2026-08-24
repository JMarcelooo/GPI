const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Edições da RPI (INPI) já processadas pelo monitor de publicações.
// A PK é o número da edição; a presença do registro indica que a edição
// foi baixada e processada com sucesso (auditoria + retomada pós-restart).
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
