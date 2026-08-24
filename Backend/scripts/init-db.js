require('dotenv').config();

const sequelize = require('../src/config/db');
const initModels = require('../src/models/init-models');

initModels(sequelize);

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');

    await sequelize.sync({ force: false });

    const tabelas = Object.keys(sequelize.models).sort();
    console.log(`Tabelas criadas/sincronizadas com sucesso (${tabelas.length}):`, tabelas.join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar as tabelas:', err);
    process.exit(1);
  }
}

main();
