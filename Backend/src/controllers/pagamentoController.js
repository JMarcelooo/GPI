const { Pagamento, PI } = require('../models/index');

const STATUS_VALIDOS = ['aguardando prazo', 'em andamento', 'pago'];

// GET /api/pagamentos?pi_id=
exports.listPagamentos = async (req, res) => {
  try {
    const where = {};
    if (req.query.pi_id) where.pi_id = req.query.pi_id;
    const pagamentos = await Pagamento.findAll({
      where,
      order: [['data_de_vencimento', 'DESC']]
    });
    res.json({ count: pagamentos.length, data: pagamentos });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos.' });
  }
};

// GET /api/pagamentos/:id
exports.getPagamentoById = async (req, res) => {
  try {
    const pagamento = await Pagamento.findByPk(req.params.id);
    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }
    res.json({ data: pagamento });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamento.' });
  }
};

// POST /api/pagamentos
exports.createPagamento = async (req, res) => {
  try {
    const { pi_id, tipo_de_pagamento, data_de_vencimento, data_informada, valor, status, prazo_dias, processo_sei, observacao } = req.body;

    if (!pi_id || !tipo_de_pagamento || !data_de_vencimento || valor === undefined || valor === null) {
      return res.status(400).json({
        error: 'Os campos pi_id, tipo_de_pagamento, data_de_vencimento e valor são obrigatórios.'
      });
    }

    if (isNaN(Number(valor)) || Number(valor) < 0) {
      return res.status(400).json({ error: 'Valor inválido.' });
    }

    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({
        error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
      });
    }

    if (prazo_dias !== undefined && prazo_dias !== null &&
      (isNaN(Number(prazo_dias)) || Number(prazo_dias) < 1)) {
      return res.status(400).json({ error: 'Prazo inválido. Informe um número de dias maior que zero.' });
    }

    const pi = await PI.findByPk(pi_id);
    if (!pi) {
      return res.status(404).json({ error: 'PI não encontrada.' });
    }

    const pagamento = await Pagamento.create({
      pi_id,
      tipo_de_pagamento,
      data_de_vencimento,
      data_informada: data_informada || null,
      valor: Number(valor),
      status: status || 'aguardando prazo',
      prazo_dias: prazo_dias || null,
      processo_sei: processo_sei || null,
      observacao: observacao || null
    });

    res.status(201).json({ data: pagamento });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Erro ao criar pagamento.' });
  }
};

// PUT /api/pagamentos/:id
exports.updatePagamento = async (req, res) => {
  try {
    const pagamento = await Pagamento.findByPk(req.params.id);
    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    const { pi_id, tipo_de_pagamento, data_de_vencimento, data_informada, valor, status, prazo_dias, processo_sei, observacao } = req.body;
    const updateData = {};
    if (pi_id !== undefined) updateData.pi_id = pi_id;
    if (tipo_de_pagamento !== undefined) updateData.tipo_de_pagamento = tipo_de_pagamento;
    if (data_de_vencimento !== undefined) updateData.data_de_vencimento = data_de_vencimento;
    if (data_informada !== undefined) updateData.data_informada = data_informada;
    if (valor !== undefined) {
      if (isNaN(Number(valor)) || Number(valor) < 0) {
        return res.status(400).json({ error: 'Valor inválido.' });
      }
      updateData.valor = Number(valor);
    }
    if (status !== undefined) {
      if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`
        });
      }
      updateData.status = status;
    }
    if (prazo_dias !== undefined && prazo_dias !== null) {
      if (isNaN(Number(prazo_dias)) || Number(prazo_dias) < 1) {
        return res.status(400).json({ error: 'Prazo inválido. Informe um número de dias maior que zero.' });
      }
      updateData.prazo_dias = Number(prazo_dias);
    }
    if (processo_sei !== undefined) updateData.processo_sei = processo_sei;
    if (observacao !== undefined) updateData.observacao = observacao;

    if (updateData.pi_id !== undefined) {
      const pi = await PI.findByPk(updateData.pi_id);
      if (!pi) {
        return res.status(404).json({ error: 'PI não encontrada.' });
      }
    }

    await Pagamento.update(updateData, { where: { id: req.params.id } });

    const updated = await Pagamento.findByPk(req.params.id);
    res.json({ data: updated });
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar pagamento.' });
  }
};

// DELETE /api/pagamentos/:id
exports.deletePagamento = async (req, res) => {
  try {
    const pagamento = await Pagamento.findByPk(req.params.id);
    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    await pagamento.destroy();
    res.json({ message: 'Pagamento removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover pagamento:', error);
    res.status(500).json({ error: 'Erro ao remover pagamento.' });
  }
};
