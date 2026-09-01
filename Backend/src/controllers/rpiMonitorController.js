const { Op } = require('sequelize');
const { RpiEdicao, Historico, PI } = require('../models/index');
const { verificarNovasEdicoesComTrava } = require('../services/rpiMonitorService');

// GET /api/rpi-monitor/log
// Lista todas as edições processadas pelo monitor e, para cada uma, as
// mudanças geradas (eventos do histórico com origem 'monitor_rpi').
// Edições sem nenhuma mudança voltam com "mudancas": [].
exports.getLog = async (req, res) => {
  try {
    const edicoes = await RpiEdicao.findAll({ order: [['numero', 'DESC']] });

    const eventos = await Historico.findAll({
      where: { tipo: 'rpi', detalhes: { [Op.ne]: null } },
      include: [{ model: PI, as: 'pi', attributes: ['id', 'titulo'] }],
      order: [['createdAt', 'ASC']]
    });

    // Agrupa os eventos do monitor por edição (detalhes.edicao).
    const porEdicao = new Map();
    for (const ev of eventos) {
      if (!ev.detalhes || ev.detalhes.origem !== 'monitor_rpi') continue;
      const numero = Number(ev.detalhes.edicao);
      if (Number.isNaN(numero)) continue;
      if (!porEdicao.has(numero)) porEdicao.set(numero, []);
      porEdicao.get(numero).push({
        historico_id: ev.id,
        pi_id: ev.pi_id,
        pi_titulo: ev.pi ? ev.pi.titulo : null,
        descricao: ev.descricao,
        createdAt: ev.createdAt
      });
    }

    const data = edicoes.map((e) => ({
      numero: e.numero,
      data_publicacao: e.data_publicacao,
      processada_em: e.processada_em,
      total_mudancas: (porEdicao.get(e.numero) || []).length,
      mudancas: porEdicao.get(e.numero) || []
    }));

    res.json({ count: data.length, data });
  } catch (error) {
    console.error('Erro ao buscar log do monitor de RPI:', error);
    res.status(500).json({ error: 'Erro ao buscar log do monitor de RPI.' });
  }
};

// POST /api/rpi-monitor/verificar
// Dispara manualmente a verificação de edições novas na Revista do INPI.
exports.verificar = async (req, res) => {
  try {
    const resultado = await verificarNovasEdicoesComTrava();
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao verificar edições da RPI:', error);
    const rede = (
      error && (
        error.cause?.code === 'ECONNRESET' ||
        error.cause?.code === 'ETIMEDOUT' ||
        error.cause?.code === 'ECONNREFUSED' ||
        error.message?.includes('fetch failed')
      )
    );
    res.status(500).json({
      error: rede
        ? 'Não foi possível contactar o INPI (instável ou indisponível). Tente novamente em alguns minutos.'
        : 'Erro ao verificar edições da RPI.'
    });
  }
};
