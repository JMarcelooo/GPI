const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { autenticar, exigirAdmin } = require('../middlewares/authMiddleware');

router.use(autenticar, exigirAdmin);

router.route('/')
  .get(userController.listUsuarios)
  .post(userController.createUsuario);

router.route('/:id')
  .put(userController.updateUsuario)
  .delete(userController.deleteUsuario);

module.exports = router;
