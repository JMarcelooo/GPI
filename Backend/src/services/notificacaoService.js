const { Op } = require('sequelize');
const { Pagamento, PI, Notificacao } = require('../models/index');

const TTL_SYNC_MS = 60 * 1000;
let ultimaSync = 0;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}

function montarMensagem(p, diff) {
  const piTitulo = p.pi
    ? (p.pi.titulo || p.pi.protocolo || `PI ${p.pi_id}`)
    : `PI ${p.pi_id}`;
  if (diff < 0) {
    return `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" venceu há ${Math.abs(diff)} dia(s).`;
  }
  if (diff === 0) {
    return `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" vence hoje.`;
  }
  return `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" vence em ${diff} dia(s).`;
}

// Gera/mantém as notificações a partir dos pagamentos próximos do prazo.
// É UMA notificação por pagamento (global, não por usuário). O estado de
// leitura é compartilhado: quando qualquer usuário marca como lida, todos veem.
// Idempotente e em lote (sem N+1). O resultado é cacheado por ~1 min para
// que um polling de N clientes não dispare N sincronizações.
async function sincronizarNotificacoes(forcar = false) {
  if (!forcar && Date.now() - ultimaSync < TTL_SYNC_MS) return;
  ultimaSync = Date.now();

  const pagamentos = await Pagamento.findAll({
    include: [{ model: PI, as: 'pi' }]
  });

  const qualificadas = [];
  const desqualificadas = [];
  const idsAtivos = [];

  for (const p of pagamentos) {
    idsAtivos.push(p.id);

    const status = p.status || 'aguardando prazo';
    const prazo = p.prazo_dias;
    const diff = daysUntil(p.data_de_vencimento);
    const qualifica = status !== 'pago' && prazo && diff !== null && diff <= Number(prazo);

    if (qualifica) {
      qualificadas.push({
        pagamento_id: p.id,
        pi_id: p.pi_id,
        tipo: 'prazo',
        mensagem: montarMensagem(p, diff),
        data_vencimento: p.data_de_vencimento
      });
    } else {
      desqualificadas.push(p.id);
    }
  }

  // Upsert em lote: cria a notificação quando inexistente ou atualiza
  // mensagem/data de vencimento. O campo "lida" fica de fora do update,
  // então o estado de leitura é preservado entre sincronizações.
  if (qualificadas.length > 0) {
    await Notificacao.bulkCreate(qualificadas, {
      updateOnDuplicate: ['mensagem', 'data_vencimento'],
      conflictAttributes: ['pagamento_id']
    });
  }

  // Pagamentos que deixaram de se qualificar (ex.: pagos) → marcar lidas.
  if (desqualificadas.length > 0) {
    await Notificacao.update(
      { lida: true },
      { where: { pagamento_id: { [Op.in]: desqualificadas }, lida: false } }
    );
  }

  // Remove órfãs (pagamentos excluídos).
  if (idsAtivos.length === 0) {
    await Notificacao.destroy({ where: {} });
  } else {
    await Notificacao.destroy({
      where: { pagamento_id: { [Op.notIn]: idsAtivos } }
    });
  }
}

module.exports = { sincronizarNotificacoes };