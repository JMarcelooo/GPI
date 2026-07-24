const PI = require('../models/PI');

require('../models/PI');

const validatePIData = (data, isUpdate = false) => {
  const errors = [];

  // Validação do título (para criação e atualização quando fornecido)
  if (!isUpdate || data.titulo !== undefined) {
    if (!data.titulo || data.titulo.length < 5) {
      errors.push('Título deve ter pelo menos 5 caracteres');
    }
  }

  // Validações específicas para criação
  if (!isUpdate) {
    const camposObrigatorios = [
      { field: 'tipo_pi', name: 'Tipo de PI' },
      { field: 'protocolo', name: 'Protocolo' },
      { field: 'depositante', name: 'Depositante' },
      { field: 'data_entrada', name: 'Data de entrada' },
      { field: 'resumo', name: 'Resumo' },
      { field: 'titulares', name: 'Titulares' }
    ];

    camposObrigatorios.forEach(({ field, name }) => {
      if (!data[field]) {
        errors.push(`${name} é obrigatório`);
      }
    });

    // Validação específica para titulares
    if (data.titulares) {
      if (!Array.isArray(data.titulares)) {
        errors.push('Titulares deve ser um array');
      } else {
        let percentualTotal = 0;
        data.titulares.forEach((titular, index) => {
          if (!titular.nome || !titular.pais || titular.percentual === undefined) {
            errors.push(`Titular ${index + 1} deve ter nome, pais e percentual`);
          }
          percentualTotal += Number(titular.percentual) || 0;
        });

        if (percentualTotal !== 100) {
          errors.push('A soma dos percentuais dos titulares deve ser 100');
        }
      }
    }

    // Validação de tipo_pi
    const tiposPermitidos = ['patente', 'marca', 'software'];
    if (data.tipo_pi && !tiposPermitidos.includes(data.tipo_pi)) {
      errors.push(`Tipo de PI inválido. Use: ${tiposPermitidos.join(', ')}`);
    }

    // Validação de status
    const statusPermitidos = ['pendente', 'concedida', 'expirada', 'negada'];
    if (data.status && !statusPermitidos.includes(data.status)) {
      errors.push(`Status inválido. Use: ${statusPermitidos.join(', ')}`);
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

    // Padroniza os dados antes de criar
    const piData = {
      ...req.body,
      cessao_assinada: req.body.cessao_assinada || false,
      parceiro: req.body.parceiro || null,
      // Para patentes, verifica se tem classificação IPC
      classificacao_ipc: req.body.tipo_pi === 'patente'
        ? req.body.classificacao_ipc || null
        : null
    };

    const newPI = await PI.create(piData);
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

    // Verifica se a PI existe antes de atualizar
    const existingPI = await PI.findByPk(req.params.id);
    if (!existingPI) {
      return res.status(404).json({
        success: false,
        error: 'PI não encontrada'
      });
    }

    // Não permite alteração do tipo_pi se já estiver definido
    if (req.body.tipo_pi && req.body.tipo_pi !== existingPI.tipo_pi) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível alterar o tipo de PI após a criação'
      });
    }

    await PI.update(req.body, {where: {id: req.params.id}});
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
    const { q, status, tipo_pi } = req.query;
    let pis = await PI.findAll();

    if (q) {
      const searchTerm = q.toLowerCase();
      pis = pis.filter(pi =>
        pi.titulo.toLowerCase().includes(searchTerm) ||
        pi.protocolo.toLowerCase().includes(searchTerm) ||
        pi.depositante.toLowerCase().includes(searchTerm) ||
        (pi.resumo && pi.resumo.toLowerCase().includes(searchTerm))
      );
    }

    if (status) {
      pis = pis.filter(pi => pi.status === status);
    }

    if (tipo_pi) {
      pis = pis.filter(pi => pi.tipo_pi === tipo_pi);
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
    const statusPermitidos = ['pendente', 'concedida', 'expirada', 'negada'];
    if (!statusPermitidos.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${statusPermitidos.join(', ')}`
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

// GET TITULARES BY PI
exports.getTitularesByPI = async (req, res) => {
  try {
    const pi = await PI.findByPk(req.params.id);
    if (!pi) {
      return res.status(404).json({
        success: false,
        error: 'PI não encontrado'
      });
    }

    const titulares = pi.titulares;
    if (!titulares || !Array.isArray(titulares)) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }


    res.json({
      success: true,
      count: titulares.filter(t => t !== null).length,
      data: titulares.filter(t => t !== null)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar titulares',
      details: error.message
    });
  }
};
