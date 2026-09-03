const { Op } = require('sequelize');
const { Pagamento, PI } = require('../models/index');
const { sincronizarNotificacoes } = require('../services/notificacaoService');
const { registrarHistorico } = require('../services/historicoService');
const { stripHtmlFields } = require('../utils/sanitize');

const PG_STRING_FIELDS = ['tipo_de_pagamento', 'processo_sei', 'observacao'];

const STATUS_VALIDOS = ['aguardando prazo', 'em andamento', 'pago'];

// GET /api/pagamentos?pi_id=&q=&status=&venc_de=&venc_at=&limit=&offset=
exports.listPagamentos = async (req, res) => {
  try {
    const { pi_id, q, status, venc_de, venc_at } = req.query;
    const where = {};
    if (pi_id) where.pi_id = pi_id;
    if (status && STATUS_VALIDOS.includes(status)) {
      // Registros sem status são tratados como "aguardando prazo".
      where.status = status === 'aguardando prazo'
        ? { [Op.or]: ['aguardando prazo', null] }
        : status;
    }
    if (venc_de || venc_at) {
      where.data_de_vencimento = {};
      if (venc_de) where.data_de_vencimento[Op.gte] = venc_de;
      if (venc_at) where.data_de_vencimento[Op.lte] = venc_at;
    }

    const include = [];
    if (q) {
      const term = `%${q}%`;
      where[Op.or] = [
        { tipo_de_pagamento: { [Op.iLike]: term } },
        { processo_sei: { [Op.iLike]: term } },
        { observacao: { [Op.iLike]: term } },
        { '$pi.titulo$': { [Op.iLike]: term } },
        { '$pi.protocolo$': { [Op.iLike]: term } }
      ];
      include.push({
        model: PI,
        as: 'pi',
        attributes: [],
        required: true
      });
    }

    const order = [['data_de_vencimento', 'DESC']];

    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const isPaginated = limitRaw !== undefined && limitRaw !== null && limitRaw !== '';

    if (isPaginated) {
      const result = await Pagamento.findAndCountAll({
        where,
        include,
        distinct: true,
        order,
        limit: Math.min(Number(limitRaw) || 10, 100),
        offset: Number(offsetRaw) || 0
      });
      return res.json({
        count: result.rows.length,
        total: result.count,
        limit: Number(limitRaw),
        offset: Number(offsetRaw) || 0,
        data: result.rows
      });
    }

    const pagamentos = await Pagamento.findAll({ where, include, order });
    res.json({ count: pagamentos.length, total: pagamentos.length, data: pagamentos });
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

    if (processo_sei !== undefined && processo_sei !== null && String(processo_sei).length > 1000) {
      return res.status(400).json({ error: 'Processo SEI muito longo (máximo 1000 caracteres).' });
    }
    if (observacao !== undefined && observacao !== null && String(observacao).length > 5000) {
      return res.status(400).json({ error: 'Observação muito longa (máximo 5000 caracteres).' });
    }
    if (tipo_de_pagamento !== undefined && String(tipo_de_pagamento).length > 255) {
      return res.status(400).json({ error: 'Tipo de pagamento muito longo (máximo 255 caracteres).' });
    }

    const pi = await PI.findByPk(pi_id);
    if (!pi) {
      return res.status(404).json({ error: 'PI não encontrada.' });
    }

    const pagamento = await Pagamento.create(stripHtmlFields({
      pi_id,
      tipo_de_pagamento,
      data_de_vencimento,
      data_informada: data_informada || null,
      valor: Number(valor),
      status: status || 'aguardando prazo',
      prazo_dias: prazo_dias || null,
      processo_sei: processo_sei || null,
      observacao: observacao || null
    }, PG_STRING_FIELDS));

    await registrarHistorico({
      pi_id: pagamento.pi_id,
      tipo: 'pagamento',
      acao: 'criacao',
      descricao: `Pagamento registrado — ${pagamento.tipo_de_pagamento || `#${pagamento.id}`}`,
      detalhes: { dados: pagamento.toJSON() },
      usuario: req.usuario
    });

    await sincronizarNotificacoes(true);

    res.status(201).json({ data: pagamento });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    if (error.parent?.code === '22001' || error.original?.code === '22001') {
      return res.status(400).json({ error: 'Campo muito longo para o banco de dados.' });
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
    if (processo_sei !== undefined) {
      if (processo_sei !== null && String(processo_sei).length > 1000) {
        return res.status(400).json({ error: 'Processo SEI muito longo (máximo 1000 caracteres).' });
      }
      updateData.processo_sei = processo_sei;
    }
    if (observacao !== undefined) {
      if (observacao !== null && String(observacao).length > 5000) {
        return res.status(400).json({ error: 'Observação muito longa (máximo 5000 caracteres).' });
      }
      updateData.observacao = observacao;
    }
    if (tipo_de_pagamento !== undefined && String(tipo_de_pagamento).length > 255) {
      return res.status(400).json({ error: 'Tipo de pagamento muito longo (máximo 255 caracteres).' });
    }

    if (updateData.pi_id !== undefined) {
      const pi = await PI.findByPk(updateData.pi_id);
      if (!pi) {
        return res.status(404).json({ error: 'PI não encontrada.' });
      }
    }

    Object.assign(updateData, stripHtmlFields(updateData, PG_STRING_FIELDS));

    await Pagamento.update(updateData, { where: { id: req.params.id } });

    await registrarHistorico({
      pi_id: updateData.pi_id || pagamento.pi_id,
      tipo: 'pagamento',
      acao: 'atualizacao',
      descricao: `Pagamento atualizado — ${updateData.tipo_de_pagamento || pagamento.tipo_de_pagamento || `#${pagamento.id}`}`,
      detalhes: { anterior: pagamento.toJSON(), novos: updateData },
      usuario: req.usuario
    });

    await sincronizarNotificacoes(true);

    const updated = await Pagamento.findByPk(req.params.id);
    res.json({ data: updated });
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        errors: error.errors.map(e => e.message)
      });
    }
    if (error.parent?.code === '22001' || error.original?.code === '22001') {
      return res.status(400).json({ error: 'Campo muito longo para o banco de dados.' });
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

    await registrarHistorico({
      pi_id: pagamento.pi_id,
      tipo: 'pagamento',
      acao: 'exclusao',
      descricao: `Pagamento removido — ${pagamento.tipo_de_pagamento || `#${pagamento.id}`}`,
      detalhes: { dados: pagamento.toJSON() },
      usuario: req.usuario
    });

    await pagamento.destroy();
    await sincronizarNotificacoes(true);
    res.json({ message: 'Pagamento removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover pagamento:', error);
    res.status(500).json({ error: 'Erro ao remover pagamento.' });
  }
};
