const { PI, autor, Pagamento } = require('../models');
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

    const sum = rows => rows.reduce((acc, r) => acc + Number(r.value || 0), 0);

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
          .map(r => ({ label: r.ano, value: Number(r.value) }))
      },
      autores: {
        total: sum(autorVinculo),
        porVinculo: autorVinculo.map(r => ({ label: r.bond || 'Sem vínculo', value: Number(r.value) }))
      },
      pagamentos: {
        total: pagTotal,
        pago: Number(pagStatus.find(r => r.status === 'pago')?.value || 0),
        aguardandoPrazo: pagAguardando,
        emAndamento: Number(pagStatus.find(r => r.status === 'em andamento')?.value || 0)
      }
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
  }
};
