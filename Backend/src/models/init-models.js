var DataTypes = require('sequelize').DataTypes;
var _autor = require('./autor');
var _PI = require('./PI');

function initModels(sequelize) {
  var autor = _autor(sequelize, DataTypes);
  var PI = _PI;

  PI.belongsToMany(autor, {
    as: 'autores',
    through: 'autor_pi',
    foreignKey: 'pi_id',
    otherKey: 'autor_id',
    timestamps: false
  });

  autor.belongsToMany(PI, {
    as: 'PIs',
    through: 'autor_pi',
    foreignKey: 'autor_id',
    otherKey: 'pi_id',
    timestamps: false
  });

  return {
    autor,
    PI
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
