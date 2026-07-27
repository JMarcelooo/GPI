const express = require('express');
const router = express.Router();
const rpiController = require('../controllers/rpiController');

router.route('/')
  .get(rpiController.listRPI)
  .post(rpiController.createRPI);

router.route('/:id')
  .put(rpiController.updateRPI)
  .delete(rpiController.deleteRPI);

module.exports = router;
