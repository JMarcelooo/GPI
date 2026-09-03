const { Op } = require('sequelize');
const { PI, RPI, Pagamento, Historico, Notificacao } = require('../models/index');
const { registrarHistorico, camposAlterados, descricaoCamposAlterados } = require('../services/historicoService');
const { stripHtmlFields } = require('../utils/sanitize');

const PI_STRING_FIELDS = ['titulo', 'depositante', 'parceiro', 'titular', 'protocolo'];

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

const parseAutorIds = (arr) => {
  if (!Array.isArray(arr)) {
    return { error: 'autores deve ser um array' };
  }
  const ids = [];
  for (const item of arr) {
    const n = Number(item);
    if (!Number.isInteger(n) || n <= 0) {
      return { error: `ID de autor inválido: ${item}` };
    }
    ids.push(n);
  }
  return { ids };
};

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

  // ano: inteiro entre 1900 e 2100 (quando informado)
  if (data.ano !== undefined && data.ano !== null && data.ano !== '') {
    const anoNum = Number(data.ano);
    if (!Number.isInteger(anoNum) || anoNum < 1900 || anoNum > 2100) {
      errors.push('Ano inválido. Use um número inteiro entre 1900 e 2100.');
    }
  }

  // data_entrada: data válida e não futura (quando informada)
  if (data.data_entrada !== undefined && data.data_entrada !== null && data.data_entrada !== '') {
    const d = new Date(data.data_entrada);
    if (isNaN(d.getTime())) {
      errors.push('Data de entrada inválida.');
    } else if (d.getTime() > Date.now()) {
      errors.push('A data de entrada não pode ser posterior à data atual.');
    }
  }

  // titular: array ou texto (quando informado)
  if (data.titular !== undefined && data.titular !== null) {
    if (!Array.isArray(data.titular) && typeof data.titular !== 'string') {
      errors.push('Titular deve ser um array ou texto.');
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

    const piData = stripHtmlFields({
      tipo: req.body.tipo,
      titulo: req.body.titulo || null,
      depositante: req.body.depositante,
      parceiro: req.body.parceiro || null,
      titular: Array.isArray(req.body.titular) ? req.body.titular : (req.body.titular ? [req.body.titular] : []),
      status: req.body.status || 'em analise',
      protocolo: req.body.protocolo,
      data_entrada: req.body.data_entrada || null,
      ano: (req.body.ano === '' || req.body.ano == null) ? null : req.body.ano,
      termo_cessao: req.body.termo_cessao || false
    }, PI_STRING_FIELDS);

    const newPI = await PI.create(piData);

    if (req.body.autores !== undefined && req.body.autores !== null) {
      const parsed = parseAutorIds(req.body.autores);
      if (parsed.error) {
        return res.status(400).json({ errors: [parsed.error] });
      }
      await newPI.addAutores(parsed.ids);
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
    const { q, status, tipo, ano, sort, order } = req.query;
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
    if (ano && !Number.isNaN(Number(ano))) where.ano = Number(ano);

    const orderCol = SORT_COLS[sort] || null;
    const orderDir = (order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const orderClause = orderCol ? [[orderCol, orderDir]] : [['id', 'ASC']];

    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const isPaginated = limitRaw !== undefined && limitRaw !== null && limitRaw !== '';

    if (isPaginated) {
      const limitNum = Number(limitRaw);
      const offsetNum = (offsetRaw !== undefined && offsetRaw !== '') ? Number(offsetRaw) : 0;

      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ errors: ['limit deve ser um inteiro entre 1 e 100.'] });
      }
      if (!Number.isInteger(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ errors: ['offset deve ser um inteiro não negativo.'] });
      }

      const total = await PI.count({ where });
      const rows = await PI.findAll({
        where,
        order: orderClause,
        limit: limitNum,
        offset: offsetNum
      });
      return res.json({
        count: rows.length,
        total,
        limit: limitNum,
        offset: offsetNum,
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
    const piId = Number(req.params.id);
    if (!Number.isInteger(piId) || piId <= 0) {
      return res.status(400).json({ errors: ['ID de PI inválido'] });
    }

    const errors = validatePIData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existingPI = await PI.findByPk(piId);
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

    Object.assign(updateData, stripHtmlFields(updateData, PI_STRING_FIELDS));

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

    await PI.update(updateData, { where: { id: piId } });

    const alterados = camposAlterados(existingPI.toJSON(), updateData);
    let textoAlteracoes = descricaoCamposAlterados(alterados);

    if (req.body.autores !== undefined) {
      const parsed = parseAutorIds(req.body.autores);
      if (parsed.error) {
        return res.status(400).json({ errors: [parsed.error] });
      }
      await existingPI.setAutores(parsed.ids);
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

    // Remove as notificações da PI (prazo e RPI) — sem FK, ficariam órfãs.
    await Notificacao.destroy({ where: { pi_id: pi.id } });

    await pi.destroy();

    // Registrado APÓS o destroy e com pi_id nulo: a FK historico→pi tem
    // ON DELETE CASCADE, então um log com pi_id seria apagado junto.
    await registrarHistorico({
      tipo: 'pi',
      acao: 'exclusao',
      descricao: `PI "${pi.titulo}" (${pi.protocolo || 'sem protocolo'}) excluída`,
      detalhes: { protocolo: pi.protocolo, titulo: pi.titulo, status: pi.status },
      usuario: req.usuario
    });

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
