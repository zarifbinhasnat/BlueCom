const express = require('express');
const router = express.Router();
const healthLogController = require('../controllers/healthLogController');

router.get('/', healthLogController.getHealthLogs);
router.get('/batch/:batch_id/summary', healthLogController.getHealthSummary);
router.post('/', healthLogController.createHealthLog);

module.exports = router;
