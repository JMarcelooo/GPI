const { Sequelize } = require('sequelize');

require('dotenv').config({ path: './.env' }); 


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// teste de conexao
sequelize.authenticate()
  .then(() => {
    console.log('conexão com o banco de dados bem-sucedida');
  })
  .catch((err) => {
    console.error('erro ao conectar com o banco de dados:', err);
  });

module.exports = sequelize;
