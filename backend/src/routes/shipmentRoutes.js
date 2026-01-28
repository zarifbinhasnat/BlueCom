const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

router.get('/', shipmentController.getAllShipments);
router.get('/:id', shipmentController.getShipmentById);
router.get('/:id/traceability', shipmentController.getShipmentTraceability);
router.post('/', shipmentController.createShipment);
router.patch('/:id/status', shipmentController.updateShipmentStatus);

module.exports = router;
