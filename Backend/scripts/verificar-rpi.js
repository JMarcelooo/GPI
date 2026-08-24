// Verificação manual/cron do monitor de publicações da RPI (INPI).
// Uso: DATABASE_URL=... node scripts/verificar-rpi.js
// Ideal para agendar via cron na 3ª feira (dia de publicação da revista).
require('dotenv').config();

const sequelize = require('../src/config/db');
// Requerir models/index já registra todos os modelos e associações
// (chamar initModels de novo duplicaria aliases e lançaria erro).
require('../src/models');
const { verificarNovasEdicoes } = require('../src/services/rpiMonitorService');

async function main() {
  try {
    await sequelize.authenticate();
    const resultado = await verificarNovasEdicoes();
    console.log('Resultado:', JSON.stringify(resultado, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Erro ao verificar novas edições da RPI:', err);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();
