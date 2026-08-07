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

    // 1) Para cada pagamento_id, mantém apenas UMA notificação
    //    (a mais recente), removendo as cópias por usuário.
    await sequelize.query(`
      DELETE FROM notificacoes
      WHERE id NOT IN (
        SELECT DISTINCT ON (pagamento_id) id
        FROM notificacoes
        ORDER BY pagamento_id, "createdAt" DESC, id DESC
      )
    `);
    console.log('OK: notificações duplicadas por usuário removidas.');

    // 2) Remove o campo usuario_id (leitura agora é global).
    //    A coluna não é mais usada; o CASCADE foi removido no modelo.
    try {
      await sequelize.query(`ALTER TABLE notificacoes DROP COLUMN IF EXISTS usuario_id`);
      console.log('OK: coluna usuario_id removida.');
    } catch (e) {
      console.log('Aviso (usuario_id):', e.message);
    }

    // 3) Garante UNIQUE em pagamento_id (1 notificação por evento).
    try {
      await sequelize.query(
        'ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_pagamento_id_key UNIQUE (pagamento_id)'
      );
      console.log('OK: constraint única em pagamento_id criada.');
    } catch (err) {
      console.warn('Aviso (unique pagamento_id):', err.message);
    }

    // 4) Remove a constraint composta antiga (pagamento_id, usuario_id), se existir.
    try {
      await sequelize.query('ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS uq_notificacao_pagamento_usuario');
      console.log('OK: constraint composta antiga removida.');
    } catch (err) {
      console.warn('Aviso (constraint composta):', err.message);
    }

    // 5) Adiciona colunas de atribuição de leitura.
    await sequelize.query(`ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS lida_por_id INTEGER`);
    await sequelize.query(`ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS lida_por_nome VARCHAR(150)`);
    await sequelize.query(`ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS lida_em TIMESTAMPTZ`);
    console.log('OK: colunas lida_por_id / lida_por_nome / lida_em criadas.');

    console.log('Migração concluída.');
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  }
}

main();