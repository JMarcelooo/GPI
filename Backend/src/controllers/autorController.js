const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const Autor = models.autor;

// CREATE
exports.createAutor = async (req, res) => {
  const { name, email, bond, department, campus, university, gender } = req.body;

  if (!name || !email || !bond || !department || !campus || !university || !gender) {
    return res.status(400).json({
      success: false,
      error: 'Todos os campos são obrigatórios'
    });
  }

  try {
    const novoAutor = await Autor.create(req.body);
    res.status(201).json({ success: true, data: novoAutor });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar autor',
      details: error.message
    });
  }
};

exports.getAllAutores = async (req, res) => {
  try {
    const autores = await Autor.findAll();
    res.status(200).json({ success: true, data: autores });
  } catch (error) {
    console.error('Erro ao buscar autores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar autores',
      details: error.message
    });
  }
};

exports.getAutorByID = async (req, res) => {
  try {
    const autor = await Autor.findByPk(req.params.id);
    if (!autor) {
      return res.status(404).json({ success: false, error: 'Autor não encontrado' });
    }
    res.status(200).json({ success: true, data: autor });
  } catch (error) {
    console.error('Erro ao buscar autores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar autores',
      details: error.message
    });
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
    console.error('Erro ao atualizar autor:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar autor',
      details: error.message
    });
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
    console.error('Erro ao deletar autor:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar autor',
      details: error.message
    });
  }
};