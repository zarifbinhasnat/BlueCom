const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Alert management
router.get('/alerts', analyticsController.getAllAlerts);
router.get('/alerts/biosecurity', analyticsController.getBiosecurityAlerts);
router.patch('/alerts/:id/status', analyticsController.updateAlertStatus);

// Mortality analysis
router.get('/mortality/analysis', analyticsController.getMortalityAnalysis);
router.get('/mortality/high-risk', analyticsController.getHighRiskBatches);

// Traceability
router.get('/traceability/batch/:batch_id', analyticsController.getBatchTraceability);
router.get('/traceability/report', analyticsController.getTraceabilityReport);

// Pricing
router.get('/pricing/overview', analyticsController.getBatchPricingOverview);
router.get('/pricing/batch/:batch_id/calculate', analyticsController.calculateSellingPrice);

module.exports = router;
