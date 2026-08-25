const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');
const { exigirAdmin } = require('../middlewares/authMiddleware');

// O histórico global é restrito a administradores.
router.use(exigirAdmin);

router.get('/', historicoController.listHistorico);
router.get('/usuarios', historicoController.listUsuariosHistorico);

module.exports = router;
