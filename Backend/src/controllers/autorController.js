const { autor: Autor } = require('../models/index');

function handleError(error, res, label) {
  console.error(`Erro ao ${label}:`, error);
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Registro duplicado. Verifique os dados únicos (email, etc).'
    });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      errors: error.errors.map(e => e.message)
    });
  }
  res.status(500).json({
    success: false,
    error: `Erro ao ${label}.`
  });
}

// CREATE
exports.createAutor = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Nome é obrigatório'
    });
  }

  try {
    const novoAutor = await Autor.create(req.body);
    res.status(201).json({ success: true, data: novoAutor });
  } catch (error) {
    handleError(error, res, 'criar autor');
  }
};

exports.getAllAutores = async (req, res) => {
  try {
    const autores = await Autor.findAll();
    res.status(200).json({ success: true, data: autores });
  } catch (error) {
    handleError(error, res, 'buscar autores');
  }
};

exports.getAutorByID = async (req, res) => {
  try {
    const autor = await Autor.findByPk(req.params.id, {
      include: [{ association: 'PIs' }]
    });
    if (!autor) {
      return res.status(404).json({ success: false, error: 'Autor não encontrado' });
    }
    res.status(200).json({ success: true, data: autor });
  } catch (error) {
    handleError(error, res, 'buscar autor');
  }
};

exports.updateAutor = async (req, res) => {
  try {
    const { id } = req.params;
    const autor = await Autor.findByPk(id);

    if (!autor) {
      return res.status(404).json({ success: false, error: 'Autor não encontrado' });
    }

    await Autor.update(req.body, { where: { id } });

    const autorAtualizado = await Autor.findByPk(id);
    return res.status(200).json({ success: true, data: autorAtualizado });
  } catch (error) {
    handleError(error, res, 'atualizar autor');
  }
};

exports.deleteAutor = async (req, res) => {
  try {
    const { id } = req.params;
    const autor = await Autor.findByPk(id);

    if (!autor) {
      return res.status(404).json({ success: false, error: 'Autor não encontrado' });
    }
    await autor.destroy();
    return res.status(200).json({ success: true, message: 'Autor deletado com sucesso' });
  } catch (error) {
    handleError(error, res, 'deletar autor');
  }
};