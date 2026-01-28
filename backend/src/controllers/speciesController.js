const db = require('../config/db');

// Get all species
exports.getAllSpecies = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT species_id, common_name, scientific_name, description, 
              target_profit_margin, ideal_temp_min, ideal_temp_max, 
              ideal_ph_min, ideal_ph_max 
       FROM species 
       ORDER BY common_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
};

// Get species by ID
exports.getSpeciesById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM species WHERE species_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
};

// Create new species
exports.createSpecies = async (req, res) => {
  try {
    const {
      common_name,
      scientific_name,
      description,
      target_profit_margin,
      ideal_temp_min,
      ideal_temp_max,
      ideal_ph_min,
      ideal_ph_max
    } = req.body;

    const result = await db.query(
      `INSERT INTO species 
       (common_name, scientific_name, description, target_profit_margin, 
        ideal_temp_min, ideal_temp_max, ideal_ph_min, ideal_ph_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [common_name, scientific_name, description, target_profit_margin,
       ideal_temp_min, ideal_temp_max, ideal_ph_min, ideal_ph_max]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating species:', error);
    res.status(500).json({ error: 'Failed to create species' });
  }
};

// Update species
exports.updateSpecies = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      common_name,
      scientific_name,
      description,
      target_profit_margin,
      ideal_temp_min,
      ideal_temp_max,
      ideal_ph_min,
      ideal_ph_max
    } = req.body;

    const result = await db.query(
      `UPDATE species 
       SET common_name = $1, scientific_name = $2, description = $3,
           target_profit_margin = $4, ideal_temp_min = $5, ideal_temp_max = $6,
           ideal_ph_min = $7, ideal_ph_max = $8
       WHERE species_id = $9
       RETURNING *`,
      [common_name, scientific_name, description, target_profit_margin,
       ideal_temp_min, ideal_temp_max, ideal_ph_min, ideal_ph_max, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating species:', error);
    res.status(500).json({ error: 'Failed to update species' });
  }
};

// Delete species
exports.deleteSpecies = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM species WHERE species_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found' });
    }

    res.json({ message: 'Species deleted successfully' });
  } catch (error) {
    console.error('Error deleting species:', error);
    res.status(500).json({ error: 'Failed to delete species' });
  }
};
