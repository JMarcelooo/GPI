const express = require('express');
const router = express.Router();
const rpiMonitorController = require('../controllers/rpiMonitorController');

// Rotas exclusivas de admin (o router é montado em app.js com autenticar).
router.get('/log', rpiMonitorController.getLog);
router.post('/verificar', rpiMonitorController.verificar);

module.exports = router;
