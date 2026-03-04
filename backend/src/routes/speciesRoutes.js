const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/speciesController');

router.get('/', speciesController.getAllSpecies);
router.get('/:id', speciesController.getSpeciesById);
router.post('/', speciesController.createSpecies);
router.put('/:id', speciesController.updateSpecies);
router.delete('/:id', speciesController.deleteSpecies);

module.exports = router;
