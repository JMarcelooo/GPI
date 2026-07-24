var DataTypes = require("sequelize").DataTypes;
var _autor = require("./autor");

function initModels(sequelize) {
  var autor = _autor(sequelize, DataTypes);


  return {
    autor,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
