const express = require('express');
const router = express.Router();
const feedingLogController = require('../controllers/feedingLogController');

router.get('/', feedingLogController.getFeedingLogs);
router.get('/batch/:batch_id/summary', feedingLogController.getFeedingSummary);
router.post('/', feedingLogController.createFeedingLog);

module.exports = router;
