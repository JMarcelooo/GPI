const { Sequelize } = require('sequelize');

require('dotenv').config({ path: './.env' });

// Bancos gerenciados (Render, Heroku...) exigem SSL. Ativa automaticamente
// quando a URL pede (sslmode=require/verify-*) ou via DATABASE_SSL=true.
const precisaSsl =
  /sslmode=(?:require|verify-ca|verify-full)/.test(process.env.DATABASE_URL || '') ||
  process.env.DATABASE_SSL === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  ...(precisaSsl ? { dialectOptions: { ssl: { rejectUnauthorized: false } } } : {}),
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
