const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

router.get('/count', notificacaoController.countNotificacoes);

router.route('/')
  .get(notificacaoController.listNotificacoes);

router.post('/marcar-todas-lidas', notificacaoController.markAllNotificacoesLidas);

router.patch('/:id', notificacaoController.markNotificacaoLida);
router.delete('/:id', notificacaoController.deleteNotificacao);

module.exports = router;