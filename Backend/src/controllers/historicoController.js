const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Historico, PI } = require('../models/index');

// GET /api/historico
// Filtros: tipo, acao, usuario, q (busca na descrição), inicio/fim,
// pi_id e paginação (limit/offset).
exports.listHistorico = async (req, res) => {
  try {
    const { tipo, acao, usuario, q, inicio, fim, pi_id } = req.query;
    const where = {};

    if (tipo) where.tipo = String(tipo);
    if (acao) where.acao = String(acao);
    if (pi_id) where.pi_id = Number(pi_id);
    if (usuario) {
      // "Sistema" cobre eventos automatizados (usuario_nome nulo ou "Sistema").
      if (String(usuario).toLowerCase() === 'sistema') {
        where[Op.or] = [
          { usuario_nome: null },
          { usuario_nome: 'Sistema' }
        ];
      } else {
        where.usuario_nome = String(usuario);
      }
    }
    if (q) {
      where.descricao = { [Op.iLike]: `%${q}%` };
    }
    if (inicio || fim) {
      where.createdAt = {};
      if (inicio) where.createdAt[Op.gte] = new Date(`${inicio}T00:00:00`);
      if (fim) where.createdAt[Op.lte] = new Date(`${fim}T23:59:59.999`);
    }

    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const isPaginated = limitRaw !== undefined && limitRaw !== null && limitRaw !== '';
    const findOpts = { where, order: [['createdAt', 'DESC']] };

    if (isPaginated) {
      findOpts.limit = Math.min(Number(limitRaw) || 30, 100);
      findOpts.offset = Number(offsetRaw) || 0;
    }

    const { rows, count } = await Historico.findAndCountAll(findOpts);

    // Enriquece com o título atual da PI quando ainda existe.
    const piIds = [...new Set(rows.map(r => r.pi_id).filter(Boolean))];
    let pisPorId = {};
    if (piIds.length > 0) {
      const pis = await PI.findAll({
        where: { id: { [Op.in]: piIds } },
        attributes: ['id', 'titulo']
      });
      pisPorId = Object.fromEntries(pis.map(p => [p.id, p.titulo]));
    }

    res.json({
      count: rows.length,
      total: count,
      data: rows.map(r => ({
        ...r.toJSON(),
        pi_titulo: r.pi_id ? (pisPorId[r.pi_id] || null) : null
      }))
    });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ error: 'Erro ao listar histórico.' });
  }
};

// GET /api/historico/usuarios — lista distinta de autores de eventos
// (para popular o filtro da tela).
exports.listUsuariosHistorico = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT DISTINCT "usuario_nome" FROM "historico" WHERE "usuario_nome" IS NOT NULL ORDER BY "usuario_nome"',
      { type: sequelize.Sequelize.QueryTypes.SELECT }
    );
    res.json({ data: rows.map(r => r.usuario_nome) });
  } catch (error) {
    console.error('Erro ao listar usuários do histórico:', error);
    res.status(500).json({ error: 'Erro ao listar usuários do histórico.' });
  }
};
