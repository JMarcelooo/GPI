const { Op } = require('sequelize');
const { Pagamento, PI, Notificacao } = require('../models/index');

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}

// Gera/mantém as notificações a partir dos pagamentos próximos do prazo.
// É idempotente: pode ser chamado a cada requisição sem gerar duplicatas.
async function sincronizarNotificacoes() {
  const pagamentos = await Pagamento.findAll({
    include: [{ model: PI, as: 'pi' }]
  });

  const idsAtivos = new Set();

  for (const p of pagamentos) {
    idsAtivos.add(p.id);

    const status = p.status || 'aguardando prazo';
    const prazo = p.prazo_dias;
    const diff = daysUntil(p.data_de_vencimento);
    const qualifica = status !== 'pago' && prazo && diff !== null && diff <= Number(prazo);

    const piTitulo = p.pi
      ? (p.pi.titulo || p.pi.protocolo || `PI ${p.pi_id}`)
      : `PI ${p.pi_id}`;

    if (qualifica) {
      let msg;
      if (diff < 0) {
        msg = `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" venceu há ${Math.abs(diff)} dia(s).`;
      } else if (diff === 0) {
        msg = `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" vence hoje.`;
      } else {
        msg = `O pagamento "${p.tipo_de_pagamento}" da PI "${piTitulo}" vence em ${diff} dia(s).`;
      }

      const [notif] = await Notificacao.findOrCreate({
        where: { pagamento_id: p.id },
        defaults: {
          pi_id: p.pi_id,
          tipo: 'prazo',
          mensagem: msg,
          data_vencimento: p.data_de_vencimento,
          lida: false
        }
      });
      await notif.update({
        mensagem: msg,
        data_vencimento: p.data_de_vencimento
      });
    } else {
      await Notificacao.update(
        { lida: true },
        { where: { pagamento_id: p.id, lida: false } }
      );
    }
  }

  await Notificacao.destroy({
    where: { pagamento_id: { [Op.notIn]: [...idsAtivos] } }
  });
}

module.exports = { sincronizarNotificacoes };