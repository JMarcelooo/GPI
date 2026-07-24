const express = require('express');
const router = express.Router();
const piController = require('../controllers/piController');

// Debug: Verifique se o controller está carregando
console.log('Controller carregado?', !!piController.createPI);

// Middleware específico para estas rotas
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Rota acessada: ${req.method} ${req.url}`);
  next();
});

// Rotas CRUD
router.route('/')
  .get(piController.getAllPIs)
  .post(piController.createPI);

router.route('/search')
  .get(piController.searchPIs);

router.route('/:id')
  .get(piController.getPIById)
  .put(piController.updatePI)
  .patch(piController.updatePI)
  .delete(piController.deletePI);

router.route('/status/:status')
  .get(piController.getPIsByStatus); 

router.route('/:id/titulares')
  .get(piController.getTitularesByPI);
  
module.exports = router;