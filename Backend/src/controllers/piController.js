const { Op } = require('sequelize');
const { PI, RPI, Pagamento, Historico } = require('../models/index');
const { registrarHistorico, camposAlterados, descricaoCamposAlterados } = require('../services/historicoService');

const SORT_COLS = {
  tipo: 'tipo',
  titulo: 'titulo',
  status: 'status',
  protocolo: 'protocolo',
  depositante: 'depositante',
  data_entrada: 'data_entrada'
};

const TIPOS_VALIDOS = [
  'patente de invencao',
  'modelo de utilidade',
  'marca',
  'programa de computador'
];

const STATUS_VALIDOS = [
  'indeferida',
  'anulada',
  'arquivada',
  'em analise',
  'deferida',
  'registrada',
  'carta patente'
];

const validatePIData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.tipo !== undefined) {
    if (!data.tipo) {
      errors.push('Tipo é obrigatório');
    } else if (!TIPOS_VALIDOS.includes(data.tipo)) {
      errors.push(`Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
    }
  }

  if (!isUpdate || data.depositante !== undefined) {
    if (!data.depositante) {
      errors.push('Depositante é obrigatório');
    }
  }

  if (!isUpdate || data.protocolo !== undefined) {
    if (!data.protocolo) {
      errors.push('Protocolo é obrigatório');
    }
  }

  if (!isUpdate) {
    if (data.status && !STATUS_VALIDOS.includes(data.status)) {
      errors.push(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`);
    }
  }

  return errors;
};

// CREATE
exports.createPI = async (req, res) => {
  try {
    const errors = validatePIData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const piData = {
      tipo: req.body.tipo,
      titulo: req.body.titulo || null,
      depositante: req.body.depositante,
      parceiro: req.body.parceiro || null,
      titular: Array.isArray(req.body.titular) ? req.body.titular : (req.body.titular ? [req.body.titular] : []),
      status: req.body.status || 'em analise',
      protocolo: req.body.protocolo,
      data_entrada: req.body.data_entrada || null,
      ano: req.body.ano || null,
      termo_cessao: req.body.termo_cessao || false
    };

    const newPI = await PI.create(piData);

    if (req.body.autores && Array.isArray(req.body.autores) && req.body.autores.length > 0) {
      const autorIds = req.body.autores;
      const values = autorIds.map(autorId => `(${newPI.id}, ${autorId})`).join(', ');
      await PI.sequelize.query(`INSERT INTO autor_pi (pi_id, autor_id) VALUES ${values}`);
    }

    await registrarHistorico({
      pi_id: newPI.id,
      tipo: 'pi',
      acao: 'criacao',
      descricao: `PI cadastrada${newPI.protocolo ? ` — protocolo ${newPI.protocolo}` : ''}`,
      detalhes: { dados: piData },
      usuario: req.usuario
    });

    res.status(201).json({ data: newPI });
  } catch (error) {
    console.error('Erro ao criar PI:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Já existe uma PI cadastrada com este protocolo.'
      });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    if (error.message && error.message.includes('does not exist')) {
      return res.status(500).json({
        error: 'Erro interno: tabela não encontrada. Execute node scripts/init-db.js no backend.'
      });
    }
    res.status(500).json({
      error: 'Erro ao criar PI.'
    });
  }
};

// READ (All) — com busca ILIKE, filtros e paginação opcionais
// Query: ?q=&status=&tipo=&sort=&order=&limit=&offset=
exports.getAllPIs = async (req, res) => {
  try {
    const { q, status, tipo, sort, order } = req.query;
    const where = {};

    if (q) {
      const term = `%${q}%`;
      where[Op.or] = [
        { protocolo: { [Op.iLike]: term } },
        { depositante: { [Op.iLike]: term } },
        { parceiro: { [Op.iLike]: term } },
        { titulo: { [Op.iLike]: term } }
      ];
    }
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    const orderCol = SORT_COLS[sort] || null;
    const orderDir = (order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const orderClause = orderCol ? [[orderCol, orderDir]] : [['id', 'ASC']];

    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const isPaginated = limitRaw !== undefined && limitRaw !== null && limitRaw !== '';

    if (isPaginated) {
      const total = await PI.count({ where });
      const rows = await PI.findAll({
        where,
        order: orderClause,
        limit: Math.min(Number(limitRaw) || 10, 100),
        offset: Number(offsetRaw) || 0
      });
      return res.json({
        count: rows.length,
        total,
        limit: Number(limitRaw),
        offset: Number(offsetRaw) || 0,
        data: rows
      });
    }

    const rows = await PI.findAll({ where, order: orderClause });
    res.json({ count: rows.length, total: rows.length, data: rows });
  } catch (error) {
    console.error('Erro ao buscar PIs:', error);
    res.status(500).json({
      error: 'Erro ao buscar PIs.'
    });
  }
};

// READ (Single)
exports.getPIById = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id, {
      include: [{ association: 'autores' }]
    });
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    res.json({ data: pi });
  } catch (error) {
    console.error('Erro ao buscar PI:', error);
    res.status(500).json({
      error: 'Erro ao buscar PI.'
    });
  }
};

// UPDATE
exports.updatePI = async (req, res) => {
  try {
    const errors = validatePIData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existingPI = await PI.findByPk(req.params.id);
    if (!existingPI) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    const updateData = {};
    const allowedFields = ['tipo', 'titulo', 'depositante', 'parceiro', 'titular', 'status', 'protocolo', 'data_entrada', 'ano', 'termo_cessao'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.status && !STATUS_VALIDOS.includes(updateData.status)) {
      return res.status(400).json({
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }

    if (updateData.tipo && !TIPOS_VALIDOS.includes(updateData.tipo)) {
      return res.status(400).json({
        error: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}`
      });
    }

    await PI.update(updateData, { where: { id: req.params.id } });

    const alterados = camposAlterados(existingPI.toJSON(), updateData);
    let textoAlteracoes = descricaoCamposAlterados(alterados);

    if (req.body.autores !== undefined) {
      await PI.sequelize.query(`DELETE FROM autor_pi WHERE pi_id = ${req.params.id}`);
      if (Array.isArray(req.body.autores) && req.body.autores.length > 0) {
        const values = req.body.autores.map(autorId => `(${req.params.id}, ${autorId})`).join(', ');
        await PI.sequelize.query(`INSERT INTO autor_pi (pi_id, autor_id) VALUES ${values}`);
      }
      textoAlteracoes = textoAlteracoes
        ? `${textoAlteracoes}; Autores: atualizados`
        : 'Autores: atualizados';
    }

    await registrarHistorico({
      pi_id: existingPI.id,
      tipo: 'pi',
      acao: 'atualizacao',
      descricao: textoAlteracoes ? `PI atualizada — ${textoAlteracoes}` : 'PI atualizada',
      detalhes: alterados,
      usuario: req.usuario
    });

    const updatedPI = await PI.findByPk(req.params.id, {
      include: [{ association: 'autores' }]
    });

    res.json({ data: updatedPI });
  } catch (error) {
    console.error('Erro ao atualizar PI:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Já existe uma PI cadastrada com este protocolo.'
      });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({
      error: 'Erro ao atualizar PI.'
    });
  }
};

// DELETE
exports.deletePI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    await pi.destroy();

    res.status(200).json({
      message: 'PI removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover PI:', error);
    res.status(500).json({
      error: 'Erro ao remover PI.'
    });
  }
};

// GET BY STATUS
exports.getPIsByStatus = async (req, res) => {
  try {
    if (!STATUS_VALIDOS.includes(req.params.status)) {
      return res.status(400).json({
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }

    const pis = await PI.findAll({ where: { status: req.params.status } });
    res.json({
      count: pis.length,
      data: pis
    });
  } catch (error) {
    console.error('Erro ao buscar PIs por status:', error);
    res.status(500).json({
      error: 'Erro ao buscar PIs por status.'
    });
  }
};

// GET RPIs BY PI
exports.getRPIsByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    const rpis = await RPI.findAll({
      where: { pi_id: req.params.id },
      order: [['data', 'DESC']]
    });

    res.json({ count: rpis.length, data: rpis });
  } catch (error) {
    console.error('Erro ao buscar RPIs da PI:', error);
    res.status(500).json({
      error: 'Erro ao buscar RPIs da PI.'
    });
  }
};

// GET PAGAMENTOS BY PI
exports.getPagamentosByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    const pagamentos = await Pagamento.findAll({
      where: { pi_id: req.params.id },
      order: [['data_de_vencimento', 'DESC']]
    });

    res.json({ count: pagamentos.length, data: pagamentos });
  } catch (error) {
    console.error('Erro ao buscar pagamentos da PI:', error);
    res.status(500).json({
      error: 'Erro ao buscar pagamentos da PI.'
    });
  }
};

// GET TITULAR
exports.getTitularesByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    res.json({
      data: Array.isArray(pi.titular) ? pi.titular : (pi.titular ? [pi.titular] : [])
    });
  } catch (error) {
    console.error('Erro ao buscar titular:', error);
    res.status(500).json({
      error: 'Erro ao buscar titular.'
    });
  }
};

// GET HISTÓRICO BY PI
exports.getHistoricoByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        error: 'PI não encontrada'
      });
    }

    const historico = await Historico.findAll({
      where: { pi_id: req.params.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ count: historico.length, data: historico });
  } catch (error) {
    console.error('Erro ao buscar histórico da PI:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico da PI.'
    });
  }
};
