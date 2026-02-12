const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');

router.get('/', farmController.getAllFarms);
router.get('/performance', farmController.getFarmPerformance);
router.get('/:id', farmController.getFarmById);
router.post('/', farmController.createFarm);
router.put('/:id', farmController.updateFarm);
router.delete('/:id', farmController.deleteFarm);

module.exports = router;
