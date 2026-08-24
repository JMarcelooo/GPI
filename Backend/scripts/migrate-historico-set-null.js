/**
 * Migração: histórico de PIs deve sobreviver à exclusão da PI.
 *
 * A FK historico.pi_id → pi.id tinha ON DELETE CASCADE, apagando todo
 * o histórico quando a PI era removida. Passa a ON DELETE SET NULL:
 * os registros permanecem com pi_id nulo (a descrição guarda os dados).
 *
 * Run once: node scripts/migrate-historico-set-null.js
 */
require('dotenv').config();
const sequelize = require('../src/config/db');

async function migrate() {
  console.log('1/2 Removendo FK antiga...');
  // O nome varia conforme quem criou a tabela (SQL manual ou sync).
  await sequelize.query('ALTER TABLE "historico" DROP CONSTRAINT IF EXISTS "historico_fk1"');
  await sequelize.query('ALTER TABLE "historico" DROP CONSTRAINT IF EXISTS "historico_pi_id_fkey"');

  console.log('2/2 Recriando FK com ON DELETE SET NULL...');
  await sequelize.query(
    'ALTER TABLE "historico" ADD CONSTRAINT "historico_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "pi"("id") ON UPDATE CASCADE ON DELETE SET NULL'
  );

  console.log('Migração concluída.');
}

migrate()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error('Erro na migração:', err);
    sequelize.close();
    process.exit(1);
  });
