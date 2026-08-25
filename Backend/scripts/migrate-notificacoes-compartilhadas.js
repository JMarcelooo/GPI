/**
 * Migração: restaura o desenho "1 notificação por evento" (compartilhada).
 *
 * O código atual (models/Notificacao + services) usa:
 *   - SEM usuario_id (leitura global, com atribuição lida_por_*)
 *   - UNIQUE (pagamento_id)  → uq_notificacao_pagamento
 *   - índice único parcial em (rpi_numero) para tipo 'rpi'
 *
 * As linhas existentes são cópias por usuário e são removidas — são
 * regeneradas automaticamente (prazo → sincronizarNotificacoes;
 * rpi → rpiMonitorService).
 *
 * Run once: node scripts/migrate-notificacoes-compartilhadas.js
 */
require('dotenv').config();
const sequelize = require('../src/config/db');

async function migrate() {
  const qi = sequelize.getQueryInterface();

  console.log('1/6 Removendo linhas duplicadas por usuário...');
  await sequelize.query('DELETE FROM "notificacoes"');

  console.log('2/6 Removendo constraint única composta antiga...');
  await sequelize.query(
    'ALTER TABLE "notificacoes" DROP CONSTRAINT IF EXISTS "uq_notificacao_pagamento_usuario"'
  );

  console.log('3/6 Removendo coluna usuario_id...');
  const cols = await qi.describeTable('notificacoes');
  if (cols.usuario_id) {
    await sequelize.query('ALTER TABLE "notificacoes" DROP COLUMN "usuario_id"');
  } else {
    console.log('   coluna usuario_id não existe, pulando.');
  }

  console.log('4/6 Recriando índice único parcial de RPI (sem usuario_id)...');
  // Uma mesma edição da RPI pode trazer várias PIs: o dedupe é por
  // edição + PI + mensagem, não apenas pela edição.
  await sequelize.query('DROP INDEX IF EXISTS "uq_notificacao_rpi"');
  await sequelize.query(
    'CREATE UNIQUE INDEX "uq_notificacao_rpi" ON "notificacoes" ("rpi_numero", "pi_id", "mensagem") WHERE "tipo" = \'rpi\' AND "rpi_numero" IS NOT NULL'
  );

  console.log('5/6 Adicionando colunas lida_por_*...');
  if (!cols.lida_por_id) {
    await sequelize.query('ALTER TABLE "notificacoes" ADD COLUMN "lida_por_id" INTEGER');
    await sequelize.query('ALTER TABLE "notificacoes" ADD COLUMN "lida_por_nome" VARCHAR(150)');
    await sequelize.query('ALTER TABLE "notificacoes" ADD COLUMN "lida_em" TIMESTAMPTZ');
  } else {
    console.log('   colunas lida_por_* já existem, pulando.');
  }

  console.log('6/6 Criando UNIQUE (pagamento_id)...');
  // Notificações de RPI têm pagamento_id nulo → coluna deve permitir NULL.
  await sequelize.query('ALTER TABLE "notificacoes" ALTER COLUMN "pagamento_id" DROP NOT NULL');
  await sequelize.query(
    'ALTER TABLE "notificacoes" DROP CONSTRAINT IF EXISTS "uq_notificacao_pagamento"'
  );
  await sequelize.query(
    'ALTER TABLE "notificacoes" ADD CONSTRAINT "uq_notificacao_pagamento" UNIQUE ("pagamento_id")'
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
