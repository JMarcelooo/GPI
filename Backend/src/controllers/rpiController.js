const { RPI, PI } = require('../models/index');

// GET /api/rpi?pi_id=
exports.listRPI = async (req, res) => {
  try {
    const where = {};
    if (req.query.pi_id) where.pi_id = req.query.pi_id;
    const rpis = await RPI.findAll({ where, order: [['data', 'DESC']] });
    res.json({ count: rpis.length, data: rpis });
  } catch (error) {
    console.error('Erro ao listar RPI:', error);
    res.status(500).json({ error: 'Erro ao listar RPI.' });
  }
};

// POST /api/rpi
exports.createRPI = async (req, res) => {
  try {
    const { data, pi_id, codigo_evento, descricao_do_evento } = req.body;

    if (!data || !pi_id || codigo_evento === undefined || codigo_evento === null) {
      return res.status(400).json({
        error: 'Os campos data, pi_id e codigo_evento são obrigatórios.'
      });
    }

    const pi = await PI.findByPk(pi_id);
    if (!pi) {
      return res.status(404).json({ error: 'PI não encontrada.' });
    }

    const rpi = await RPI.create({
      data,
      pi_id,
      codigo_evento,
      descricao_do_evento: descricao_do_evento || null
    });

    res.status(201).json({ data: rpi });
  } catch (error) {
    console.error('Erro ao criar RPI:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Erro ao criar RPI.' });
  }
};

// PUT /api/rpi/:id
exports.updateRPI = async (req, res) => {
  try {
    const rpi = await RPI.findByPk(req.params.id);
    if (!rpi) {
      return res.status(404).json({ error: 'RPI não encontrada.' });
    }

    const { data, codigo_evento, descricao_do_evento } = req.body;
    const updateData = {};
    if (data !== undefined) updateData.data = data;
    if (codigo_evento !== undefined) updateData.codigo_evento = codigo_evento;
    if (descricao_do_evento !== undefined) updateData.descricao_do_evento = descricao_do_evento;

    await RPI.update(updateData, { where: { id: req.params.id } });

    const updated = await RPI.findByPk(req.params.id);
    res.json({ data: updated });
  } catch (error) {
    console.error('Erro ao atualizar RPI:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar RPI.' });
  }
};

// DELETE /api/rpi/:id
exports.deleteRPI = async (req, res) => {
  try {
    const rpi = await RPI.findByPk(req.params.id);
    if (!rpi) {
      return res.status(404).json({ error: 'RPI não encontrada.' });
    }

    await rpi.destroy();
    res.json({ message: 'RPI removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover RPI:', error);
    res.status(500).json({ error: 'Erro ao remover RPI.' });
  }
};
