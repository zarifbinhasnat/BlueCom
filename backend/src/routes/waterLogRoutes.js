const express = require('express');
const router = express.Router();
const waterLogController = require('../controllers/waterLogController');

router.get('/', waterLogController.getWaterLogs);
router.get('/tank/:tank_id/compliance', waterLogController.checkWaterCompliance);
router.post('/', waterLogController.createWaterLog);

module.exports = router;
