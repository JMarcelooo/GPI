/**
 * Migração reversa de notificações: restaura o desenho "1 notificação por usuário".
 *
 * Contexto: o banco havia sido migrado para 1 notificação por pagamento
 * (coluna usuario_id removida + colunas lida_por_*). O código atual
 * (models/notificacoes + services) voltou ao desenho por usuário:
 *   - usuario_id INTEGER NOT NULL
 *   - UNIQUE (pagamento_id, usuario_id)
 *
 * As linhas existentes são incompatíveis com o novo schema e são
 * regeneradas automaticamente (prazo → sincronizarNotificacoes;
 * rpi → rpiMonitorService), por isso são removidas.
 *
 * Run once: node scripts/migrate-notificacoes-por-usuario.js
 */
require('dotenv').config();
const sequelize = require('../src/config/db');

async function migrate() {
  const qi = sequelize.getQueryInterface();

  console.log('1/5 Removendo linhas incompatíveis de notificacoes...');
  await sequelize.query('DELETE FROM "notificacoes"');

  console.log('2/5 Removendo constraint única antiga (pagamento_id)...');
  await sequelize.query(
    'ALTER TABLE "notificacoes" DROP CONSTRAINT IF EXISTS "notificacoes_pagamento_id_key"'
  );
  // Caso a constraint tenha sido recriada com o nome do modelo:
  await sequelize.query(
    'ALTER TABLE "notificacoes" DROP CONSTRAINT IF EXISTS "uq_notificacao_pagamento_usuario"'
  );

  console.log('3/5 Adicionando coluna usuario_id...');
  const cols = await qi.describeTable('notificacoes');
  if (!cols.usuario_id) {
    await sequelize.query(
      'ALTER TABLE "notificacoes" ADD COLUMN "usuario_id" INTEGER NOT NULL'
    );
  } else {
    console.log('   coluna usuario_id já existe, pulando.');
  }

  console.log('3.5/5 Adicionando coluna rpi_numero (monitor de RPI)...');
  if (!cols.rpi_numero) {
    await sequelize.query(
      'ALTER TABLE "notificacoes" ADD COLUMN "rpi_numero" INTEGER'
    );
    // Índice único parcial citado no modelo: dedupe de notificações RPI.
    await sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_notificacao_rpi" ON "notificacoes" ("rpi_numero", "usuario_id") WHERE "tipo" = \'rpi\' AND "rpi_numero" IS NOT NULL'
    );
  } else {
    console.log('   coluna rpi_numero já existe, pulando.');
  }

  console.log('4/5 Removendo colunas lida_por_*...');
  for (const col of ['lida_por_id', 'lida_por_nome', 'lida_em']) {
    if (cols[col]) {
      await sequelize.query(`ALTER TABLE "notificacoes" DROP COLUMN "${col}"`);
    }
  }

  console.log('5/5 Criando UNIQUE (pagamento_id, usuario_id)...');
  await sequelize.query(
    'ALTER TABLE "notificacoes" ADD CONSTRAINT "uq_notificacao_pagamento_usuario" UNIQUE ("pagamento_id", "usuario_id")'
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
