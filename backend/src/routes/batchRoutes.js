const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.get('/', batchController.getAllBatches);
router.get('/:id', batchController.getBatchById);
router.get('/:id/financials', batchController.getBatchFinancials);
router.get('/:id/pricing', batchController.getBatchPricing);
router.post('/', batchController.createBatch);
router.put('/:id', batchController.updateBatch);
router.put('/:id/financials', batchController.updateBatchFinancials);
router.delete('/:id', batchController.deleteBatch);

module.exports = router;
