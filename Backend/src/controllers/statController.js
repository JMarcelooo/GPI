const { PI, autor, Pagamento } = require('../models');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

// GET /api/stats
exports.getStats = async (req, res) => {
  try {
    const [piStatus, piTipo, piAno, autorVinculo, pagStatus] = await Promise.all([
      PI.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        group: ['status'],
        raw: true
      }),
      PI.findAll({
        attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        group: ['tipo'],
        raw: true
      }),
      PI.findAll({
        attributes: [
          [sequelize.literal('COALESCE("ano"::text, EXTRACT(YEAR FROM "data_entrada")::text, EXTRACT(YEAR FROM "createdAt")::text, \'-\')'), 'ano'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'value']
        ],
        group: [sequelize.literal('1')],
        raw: true
      }),
      autor.findAll({
        attributes: ['bond', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        group: ['bond'],
        raw: true
      }),
      Pagamento.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        group: ['status'],
        raw: true
      })
    ]);

    // Investimento total e por PI (soma dos valores de pagamento)
    const custoRows = await Pagamento.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      raw: true
    });
    const totalInvestido = Number(custoRows[0]?.total || 0);

    // Tempo médio de tramitação (dias entre data_entrada e o último evento RPI)
    // para PIs que já atingiram um desfecho.
    const desfechos = ['deferida', 'registrada', 'carta patente', 'indeferida', 'anulada', 'arquivada'];
    const tempoQuery = await sequelize.query(`
      SELECT AVG(span)::float AS dias FROM (
        SELECT MAX(r.data)::date - p.data_entrada::date AS span
        FROM pi p
        JOIN "RPI" r ON r.pi_id = p.id
        WHERE p.data_entrada IS NOT NULL AND p.status IN (:desfechos)
        GROUP BY p.id
      ) t
    `, {
      replacements: { desfechos },
      type: Sequelize.QueryTypes.SELECT
    });
    const spans = tempoQuery.filter(t => t.dias !== null && t.dias >= 0);
    const tempoMedioDias = spans.length
      ? Math.round(spans.reduce((a, t) => a + Number(t.dias), 0) / spans.length)
      : null;

    const sum = rows => rows.reduce((acc, r) => acc + Number(r.value || 0), 0);

    // Funil de conversão: contagens por status + taxa de sucesso
    const conversao = sum(piStatus);
    const comDesfecho = piStatus
      .filter(r => desfechos.includes(r.status))
      .reduce((acc, r) => acc + Number(r.value || 0), 0);
    const sucesso = piStatus
      .filter(r => ['deferida', 'registrada', 'carta patente'].includes(r.status))
      .reduce((acc, r) => acc + Number(r.value || 0), 0);
    const insucesso = piStatus
      .filter(r => ['indeferida', 'anulada', 'arquivada'].includes(r.status))
      .reduce((acc, r) => acc + Number(r.value || 0), 0);

    const ativosStatus = ['deferida', 'registrada', 'carta patente'];
    const pendentesStatus = ['indeferida', 'anulada', 'arquivada'];

    const pagTotal = sum(pagStatus);
    const pagAguardando = pagStatus
      .filter(r => !r.status || r.status === 'aguardando prazo')
      .reduce((acc, r) => acc + Number(r.value || 0), 0);

    res.json({
      pi: {
        total: sum(piStatus),
        ativos: piStatus.filter(r => ativosStatus.includes(r.status)).reduce((acc, r) => acc + Number(r.value || 0), 0),
        emProcesso: Number(piStatus.find(r => r.status === 'em analise')?.value || 0),
        pendentes: piStatus.filter(r => pendentesStatus.includes(r.status)).reduce((acc, r) => acc + Number(r.value || 0), 0),
        porStatus: piStatus.map(r => ({ label: r.status, value: Number(r.value) })),
        porTipo: piTipo.map(r => ({ label: r.tipo, value: Number(r.value) })),
        porAno: piAno
          .sort((a, b) => {
            if (a.ano === '-') return 1;
            if (b.ano === '-') return -1;
            return Number(a.ano) - Number(b.ano);
          })
          .map(r => ({ label: r.ano, value: Number(r.value) })),
        totalInvestido,
        custoMedioPorPI: conversao ? Math.round(totalInvestido / conversao) : 0,
        custoPorSucesso: sucesso ? Math.round(totalInvestido / sucesso) : 0,
        tempoMedioDias,
        funil: {
          emAnalise: Number(piStatus.find(r => r.status === 'em analise')?.value || 0),
          deferida: Number(piStatus.find(r => r.status === 'deferida')?.value || 0),
          registradaOuCarta: piStatus
            .filter(r => ['registrada', 'carta patente'].includes(r.status))
            .reduce((acc, r) => acc + Number(r.value || 0), 0),
          indeferidaOuAnulada: piStatus
            .filter(r => ['indeferida', 'anulada'].includes(r.status))
            .reduce((acc, r) => acc + Number(r.value || 0), 0),
          arquivada: Number(piStatus.find(r => r.status === 'arquivada')?.value || 0),
          taxaSucesso: conversao ? Math.round((sucesso / conversao) * 100) : 0,
          taxaInsucesso: conversao ? Math.round((insucesso / conversao) * 100) : 0,
          comDesfecho: comDesfecho
        }
      },
      autores: {
        total: sum(autorVinculo),
        porVinculo: autorVinculo.map(r => ({ label: r.bond || 'Sem vínculo', value: Number(r.value) }))
      },
      pagamentos: {
        total: pagTotal,
        pago: Number(pagStatus.find(r => r.status === 'pago')?.value || 0),
        aguardandoPrazo: pagAguardando,
        emAndamento: Number(pagStatus.find(r => r.status === 'em andamento')?.value || 0),
        totalInvestido
      }
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
  }
};
