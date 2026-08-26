var DataTypes = require('sequelize').DataTypes;
var _autor = require('./autor');
var _PI = require('./PI');
var _RPI = require('./RPI');
var _Pagamento = require('./Pagamento');
var _Notificacao = require('./Notificacao');
var _Historico = require('./Historico');
var _User = require('./User');
var _RevokedToken = require('./RevokedToken');
var RpiEdicao = require('./RpiEdicao');

function initModels(sequelize) {
  var autor = _autor(sequelize, DataTypes);
  var PI = _PI;
  var RPI = _RPI;
  var Pagamento = _Pagamento;
  var Notificacao = _Notificacao;
  var Historico = _Historico;
  var User = _User;
  var RevokedToken = _RevokedToken;

  PI.belongsToMany(autor, {
    as: 'autores',
    through: 'autor_pi',
    foreignKey: 'pi_id',
    otherKey: 'autor_id',
    timestamps: false,
    onDelete: 'CASCADE'
  });

  autor.belongsToMany(PI, {
    as: 'PIs',
    through: 'autor_pi',
    foreignKey: 'autor_id',
    otherKey: 'pi_id',
    timestamps: false,
    onDelete: 'CASCADE'
  });

  PI.hasMany(RPI, {
    as: 'rpis',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  RPI.belongsTo(PI, {
    as: 'pi',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  PI.hasMany(Pagamento, {
    as: 'pagamentos',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  Pagamento.belongsTo(PI, {
    as: 'pi',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  PI.hasMany(Historico, {
    as: 'historicos',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  Historico.belongsTo(PI, {
    as: 'pi',
    foreignKey: 'pi_id',
    onDelete: 'CASCADE'
  });

  return {
    autor,
    PI,
    RPI,
    Pagamento,
    Notificacao,
    Historico,
    User,
    RevokedToken,
    RpiEdicao
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
