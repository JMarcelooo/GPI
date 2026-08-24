const { Op } = require('sequelize');
const { Pagamento, PI, Notificacao, User } = require('../models/index');

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
// Cada usuário ativo recebe a própria cópia, então a leitura é individual
// (um usuário pode marcar como lida sem afetar o outro).
// Idempotente e em lote (sem N+1). O resultado é cacheado por ~1 min para
// que um polling de N clientes não dispare N sincronizações.
async function sincronizarNotificacoes(forcar = false) {
  if (!forcar && Date.now() - ultimaSync < TTL_SYNC_MS) return;
  ultimaSync = Date.now();

  const usuarios = await User.findAll({ where: { ativo: true }, attributes: ['id'] });
  if (usuarios.length === 0) return;

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
      for (const u of usuarios) {
        qualificadas.push({
          pagamento_id: p.id,
          usuario_id: u.id,
          pi_id: p.pi_id,
          tipo: 'prazo',
          mensagem: montarMensagem(p, diff),
          data_vencimento: p.data_de_vencimento,
          lida: false
        });
      }
    } else {
      desqualificadas.push(p.id);
    }
  }

  // Upsert em lote: cria as novas (uma por usuário) e atualiza
  // mensagem/data de vencimento das existentes em uma única query.
  // O campo "lida" fica de fora do update, então o estado de leitura de
  // cada usuário é preservado.
  if (qualificadas.length > 0) {
    await Notificacao.bulkCreate(qualificadas, {
      updateOnDuplicate: ['mensagem', 'data_vencimento'],
      conflictAttributes: ['pagamento_id', 'usuario_id']
    });
  }

  // Pagamentos que deixaram de se qualificar (ex.: pagos) → marcar lidas
  // para todos os usuários em lote. Escopado a tipo 'prazo' para nunca
  // tocar nas notificações do monitor de RPI.
  if (desqualificadas.length > 0) {
    await Notificacao.update(
      { lida: true },
      { where: { tipo: 'prazo', pagamento_id: { [Op.in]: desqualificadas }, lida: false } }
    );
  }

  // Remove órfãs (pagamentos excluídos). Escopado a tipo 'prazo' —
  // notificações de RPI têm pagamento_id nulo e NÃO devem ser apagadas.
  if (idsAtivos.length === 0) {
    await Notificacao.destroy({ where: { tipo: 'prazo', pagamento_id: { [Op.ne]: null } } });
  } else {
    await Notificacao.destroy({
      where: { tipo: 'prazo', pagamento_id: { [Op.notIn]: idsAtivos } }
    });
  }
}

module.exports = { sincronizarNotificacoes };