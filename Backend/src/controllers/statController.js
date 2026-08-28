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

    // ---- Autores: gênero, campus, departamento, top autores ----
    const [autorGenero, autorCampus, autorDepartamento, topAutores] = await Promise.all([
      autor.findAll({
        attributes: ['gender', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        group: ['gender'],
        raw: true
      }),
      autor.findAll({
        attributes: ['campus', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        where: { campus: { [Sequelize.Op.not]: null } },
        group: ['campus'],
        order: [[sequelize.literal('value'), 'DESC']],
        raw: true
      }),
      autor.findAll({
        attributes: ['department', [sequelize.fn('COUNT', sequelize.col('id')), 'value']],
        where: { department: { [Sequelize.Op.not]: null } },
        group: ['department'],
        order: [[sequelize.literal('value'), 'DESC']],
        limit: 10,
        raw: true
      }),
      sequelize.query(`
        SELECT a.id, a.name, COUNT(ap.pi_id) AS pis
        FROM autor a
        JOIN autor_pi ap ON ap.autor_id = a.id
        GROUP BY a.id, a.name
        ORDER BY pis DESC
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT })
    ]);

    // ---- PIs por titular/instituição (titular é jsonb / array JSON) ----
    const piTitular = await sequelize.query(`
      SELECT elem AS label, COUNT(*) AS value
      FROM (
        SELECT jsonb_array_elements_text(titular::jsonb) AS elem
        FROM pi
        WHERE titular IS NOT NULL
          AND titular::text <> '[]'
          AND titular::text <> 'null'
      ) s
      WHERE elem IS NOT NULL AND elem <> ''
      GROUP BY label
      ORDER BY value DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });

    // ---- Pagamentos: por ano, por tipo de PI, semáforo, próximos vencimentos ----
    const [pagPorAno, pagPorTipoPI, pagSemaforo, proximosVencimentos, custoMedioPorTipo] = await Promise.all([
      sequelize.query(`
        SELECT EXTRACT(YEAR FROM data_de_vencimento)::int AS ano, COALESCE(SUM(valor), 0) AS value
        FROM pagamentos
        GROUP BY ano
        ORDER BY ano
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT p.tipo AS label, COALESCE(SUM(pg.valor), 0) AS value
        FROM pagamentos pg
        JOIN pi p ON p.id = pg.pi_id
        GROUP BY p.tipo
        ORDER BY value DESC
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT
          COUNT(*) FILTER (WHERE data_de_vencimento < CURRENT_DATE AND status <> 'pago') AS vencidos,
          COUNT(*) FILTER (WHERE status = 'pago') AS emDia,
          COUNT(*) FILTER (WHERE data_de_vencimento >= CURRENT_DATE AND status <> 'pago') AS futuros
        FROM pagamentos
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT id, tipo_de_pagamento, valor, data_de_vencimento, pi_id, status
        FROM pagamentos
        WHERE status <> 'pago' AND data_de_vencimento IS NOT NULL
        ORDER BY data_de_vencimento ASC
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT p.tipo AS label, COALESCE(AVG(pg.valor), 0) AS value
        FROM pagamentos pg
        JOIN pi p ON p.id = pg.pi_id
        GROUP BY p.tipo
      `, { type: Sequelize.QueryTypes.SELECT })
    ]);

    // ---- Cruzamentos ----
    const [produtividadePorDepartamento, generoVinculo, investimentoPorStatus] = await Promise.all([
      sequelize.query(`
        SELECT a.department AS label, COUNT(DISTINCT p.id) AS value
        FROM autor a
        JOIN autor_pi ap ON ap.autor_id = a.id
        JOIN pi p ON p.id = ap.pi_id
        WHERE a.department IS NOT NULL
        GROUP BY a.department
        ORDER BY value DESC
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT gender, bond, COUNT(*) AS value
        FROM autor
        GROUP BY gender, bond
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT p.status AS label, COALESCE(SUM(pg.valor), 0) AS value
        FROM pagamentos pg
        JOIN pi p ON p.id = pg.pi_id
        GROUP BY p.status
      `, { type: Sequelize.QueryTypes.SELECT })
    ]);

    // ---- Agregações financeiras e de cruzamento adicionais ----
    const [pagPorAnoPago, aVencer30, piPorAnoTipo, generoVinculoPIs, produtividadePorCampus, pagValores] = await Promise.all([
      sequelize.query(`
        SELECT EXTRACT(YEAR FROM data_de_vencimento)::int AS ano, COALESCE(SUM(valor), 0) AS value
        FROM pagamentos
        WHERE status = 'pago'
        GROUP BY ano
        ORDER BY ano
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT COUNT(*) AS c
        FROM pagamentos
        WHERE status <> 'pago'
          AND data_de_vencimento IS NOT NULL
          AND data_de_vencimento >= CURRENT_DATE
          AND data_de_vencimento <= CURRENT_DATE + INTERVAL '30 days'
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT
          COALESCE("ano"::text, EXTRACT(YEAR FROM "data_entrada")::text, EXTRACT(YEAR FROM "createdAt")::text, '-') AS ano,
          tipo,
          COUNT(*) AS value
        FROM pi
        GROUP BY 1, 2
        ORDER BY 1, 2
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT a.gender, a.bond, COUNT(DISTINCT p.id) AS value
        FROM autor a
        JOIN autor_pi ap ON ap.autor_id = a.id
        JOIN pi p ON p.id = ap.pi_id
        GROUP BY a.gender, a.bond
      `, { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT a.campus AS label, COUNT(DISTINCT p.id) AS value
        FROM autor a
        JOIN autor_pi ap ON ap.autor_id = a.id
        JOIN pi p ON p.id = ap.pi_id
        WHERE a.campus IS NOT NULL
        GROUP BY a.campus
        ORDER BY value DESC
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT }),
      Pagamento.findAll({
        attributes: ['status', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
        group: ['status'],
        raw: true
      })
    ]);

    const valorPago = Number(pagValores.find(r => r.status === 'pago')?.total || 0);
    const valorPendente = pagValores.filter(r => r.status !== 'pago').reduce((a, r) => a + Number(r.total || 0), 0);

    // Investimento total e por PI (soma dos valores de pagamento)
    const custoRows = await Pagamento.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      raw: true
    });
    const totalInvestido = Number(custoRows[0]?.total || 0);

    // Tempo médio de tramitação (dias entre data_entrada e o último evento RPI)
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
    const toRows = (rows, labelKey) => rows.map(r => ({
      label: String(r[labelKey] ?? '—'),
      value: Number(r.value || 0)
    }));

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
        porAnoTipo: piPorAnoTipo.map(r => ({ ano: r.ano, tipo: r.tipo, value: Number(r.value) })),
        porTitular: toRows(piTitular, 'label'),
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
          comDesfecho
        },
        totalInvestido,
        custoMedioPorPI: conversao ? Math.round(totalInvestido / conversao) : 0,
        custoPorSucesso: sucesso ? Math.round(totalInvestido / sucesso) : 0,
        tempoMedioDias
      },
      autores: {
        total: sum(autorVinculo),
        porVinculo: autorVinculo.map(r => ({ label: r.bond || 'Sem vínculo', value: Number(r.value) })),
        porGenero: toRows(autorGenero, 'gender'),
        porCampus: toRows(autorCampus, 'campus'),
        porDepartamento: toRows(autorDepartamento, 'department'),
        topAutores: topAutores.map(r => ({ id: r.id, name: r.name, pis: Number(r.pis) }))
      },
      pagamentos: {
        total: pagTotal,
        pago: Number(pagStatus.find(r => r.status === 'pago')?.value || 0),
        aguardandoPrazo: pagAguardando,
        emAndamento: Number(pagStatus.find(r => r.status === 'em andamento')?.value || 0),
        totalInvestido,
        valorPago,
        valorPendente,
        aVencer30: Number(aVencer30[0]?.c || 0),
        porAno: pagPorAno.map(r => ({ ano: r.ano, value: Number(r.value) })),
        porAnoPago: pagPorAnoPago.map(r => ({ ano: r.ano, value: Number(r.value) })),
        porTipoPI: toRows(pagPorTipoPI, 'label'),
        semaforo: {
          vencidos: Number(pagSemaforo[0]?.vencidos || 0),
          emDia: Number(pagSemaforo[0]?.emDia || 0),
          futuros: Number(pagSemaforo[0]?.futuros || 0)
        },
        proximosVencimentos: proximosVencimentos.map(r => ({
          id: r.id,
          tipo: r.tipo_de_pagamento,
          valor: Number(r.valor),
          vencimento: r.data_de_vencimento,
          pi_id: r.pi_id,
          status: r.status
        })),
        custoMedioPorTipo: toRows(custoMedioPorTipo, 'label')
      },
      cruzamentos: {
        custoMedioPorTipo: toRows(custoMedioPorTipo, 'label'),
        produtividadePorDepartamento: toRows(produtividadePorDepartamento, 'label'),
        produtividadePorCampus: toRows(produtividadePorCampus, 'label'),
        generoVinculo: generoVinculo.map(r => ({ gender: r.gender, bond: r.bond, value: Number(r.value) })),
        generoVinculoPIs: generoVinculoPIs.map(r => ({ gender: r.gender, bond: r.bond, value: Number(r.value) })),
        investimentoPorStatus: toRows(investimentoPorStatus, 'label')
      }
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
  }
};
