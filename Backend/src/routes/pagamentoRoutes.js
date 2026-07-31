const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

router.route('/')
  .get(pagamentoController.listPagamentos)
  .post(pagamentoController.createPagamento);

router.route('/:id')
  .get(pagamentoController.getPagamentoById)
  .put(pagamentoController.updatePagamento)
  .delete(pagamentoController.deletePagamento);

module.exports = router;
