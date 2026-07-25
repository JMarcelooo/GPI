const PI = require('../models/PI');

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

  if (!isUpdate || data.titulo !== undefined) {
    if (!data.titulo) {
      errors.push('Titulo é obrigatório');
    } else if (!TIPOS_VALIDOS.includes(data.titulo)) {
      errors.push(`Titulo inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
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
      return res.status(400).json({ success: false, errors });
    }

    const piData = {
      titulo: req.body.titulo,
      depositante: req.body.depositante,
      parceiro: req.body.parceiro || null,
      titular: req.body.titular || null,
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

    res.status(201).json({ success: true, data: newPI });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar PI',
      details: error.message
    });
  }
};

// READ (All)
exports.getAllPIs = async (req, res) => {
  try {
    const pis = await PI.findAll();
    res.json({
      success: true,
      count: pis.length,
      data: pis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar PIs',
      details: error.message
    });
  }
};

// READ (Single)
exports.getPIById = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        success: false,
        error: 'PI não encontrada'
      });
    }
    res.json({ success: true, data: pi });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar PI',
      details: error.message
    });
  }
};

// UPDATE
exports.updatePI = async (req, res) => {
  try {
    const errors = validatePIData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const existingPI = await PI.findByPk(req.params.id);
    if (!existingPI) {
      return res.status(404).json({
        success: false,
        error: 'PI não encontrada'
      });
    }

    const updateData = {};
    const allowedFields = ['titulo', 'depositante', 'parceiro', 'titular', 'status', 'protocolo', 'data_entrada', 'ano', 'termo_cessao'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.status && !STATUS_VALIDOS.includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }

    if (updateData.titulo && !TIPOS_VALIDOS.includes(updateData.titulo)) {
      return res.status(400).json({
        success: false,
        error: `Titulo inválido. Use: ${TIPOS_VALIDOS.join(', ')}`
      });
    }

    await PI.update(updateData, { where: { id: req.params.id } });
    const updatedPI = await PI.findByPk(req.params.id);
    res.json({ success: true, data: updatedPI });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar PI',
      details: error.message
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
      success: true,
      message: 'PI removida com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao remover PI',
      details: error.message
    });
  }
};

// SEARCH
exports.searchPIs = async (req, res) => {
  try {
    const { q, status, titulo } = req.query;
    let pis = await PI.findAll();

    if (q) {
      const searchTerm = q.toLowerCase();
      pis = pis.filter(pi =>
        pi.protocolo.toLowerCase().includes(searchTerm) ||
        pi.depositante.toLowerCase().includes(searchTerm) ||
        (pi.parceiro && pi.parceiro.toLowerCase().includes(searchTerm)) ||
        (pi.titular && pi.titular.toLowerCase().includes(searchTerm))
      );
    }

    if (status) {
      pis = pis.filter(pi => pi.status === status);
    }

    if (titulo) {
      pis = pis.filter(pi => pi.titulo === titulo);
    }

    res.json({
      success: true,
      count: pis.length,
      data: pis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro na busca',
      details: error.message
    });
  }
};

// GET BY STATUS
exports.getPIsByStatus = async (req, res) => {
  try {
    if (!STATUS_VALIDOS.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }

    const pis = await PI.findAll({ where: { status: req.params.status } });
    res.json({
      success: true,
      count: pis.length,
      data: pis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar PIs por status',
      details: error.message
    });
  }
};

// GET TITULAR
exports.getTitularesByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        success: false,
        error: 'PI não encontrada'
      });
    }

    res.json({
      success: true,
      data: pi.titular || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar titular',
      details: error.message
    });
  }
};
