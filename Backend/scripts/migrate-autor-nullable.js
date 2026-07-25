require('dotenv').config({ path: './.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: true,
});

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco.');

    const alteracoes = [
      `ALTER TABLE autor ALTER COLUMN email DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN bond DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN department DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN campus DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN university DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN gender DROP NOT NULL`,
      `ALTER TABLE autor ALTER COLUMN phone DROP NOT NULL`,
    ];

    for (const sql of alteracoes) {
      await sequelize.query(sql);
      console.log(`OK: ${sql}`);
    }

    console.log('Migração concluída.');
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  }
}

main();
