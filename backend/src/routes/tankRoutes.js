const express = require('express');
const router = express.Router();
const tankController = require('../controllers/tankController');

router.get('/', tankController.getAllTanks);
router.get('/:id', tankController.getTankById);
router.post('/', tankController.createTank);
router.put('/:id', tankController.updateTank);
router.delete('/:id', tankController.deleteTank);

module.exports = router;
