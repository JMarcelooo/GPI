const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimit');

router.post('/login', loginLimiter, authController.login);
router.post('/ativar', authController.ativarConta);
router.post('/esqueci', loginLimiter, authController.solicitarReset);
router.post('/verificar-codigo', authController.verificarCodigo);
router.post('/redefinir', authController.redefinirSenha);
router.post('/logout', autenticar, authController.logout);
router.get('/me', autenticar, authController.me);
router.put('/me', autenticar, authController.atualizarMeuPerfil);
router.post('/alterar-senha', autenticar, authController.alterarSenha);

module.exports = router;
