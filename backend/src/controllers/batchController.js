const db = require('../config/db');

// Get all batches
exports.getAllBatches = async (req, res) => {
  try {
    const { farm_id, species_id, stage } = req.query;
    
    let query = `
      SELECT b.*, s.common_name, t.tank_name, f.farm_name
      FROM batch b
      JOIN species s ON b.species_id = s.species_id
      JOIN tank t ON b.tank_id = t.tank_id
      JOIN farm f ON t.farm_id = f.farm_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (farm_id) {
      query += ` AND f.farm_id = $${paramCount}`;
      params.push(farm_id);
      paramCount++;
    }
    
    if (species_id) {
      query += ` AND b.species_id = $${paramCount}`;
      params.push(species_id);
      paramCount++;
    }
    
    if (stage) {
      query += ` AND b.stage = $${paramCount}`;
      params.push(stage);
      paramCount++;
    }
    
    query += ' ORDER BY b.birth_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
};

// Get batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT b.*, s.common_name, s.scientific_name, t.tank_name, 
              t.tank_type, f.farm_name, f.location
       FROM batch b
       JOIN species s ON b.species_id = s.species_id
       JOIN tank t ON b.tank_id = t.tank_id
       JOIN farm f ON t.farm_id = f.farm_id
       WHERE b.batch_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
};

// Create new batch
exports.createBatch = async (req, res) => {
  try {
    const {
      species_id,
      tank_id,
      birth_date,
      initial_quantity,
      stage,
      estimated_harvest_date
    } = req.body;

    const result = await db.query(
      `INSERT INTO batch 
       (species_id, tank_id, birth_date, initial_quantity, current_quantity, 
        stage, estimated_harvest_date)
       VALUES ($1, $2, $3, $4, $4, $5, $6)
       RETURNING *`,
      [species_id, tank_id, birth_date, initial_quantity, stage || 'Fry', estimated_harvest_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

// Update batch
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      species_id,
      tank_id,
      birth_date,
      initial_quantity,
      current_quantity,
      stage,
      estimated_harvest_date
    } = req.body;

    const result = await db.query(
      `UPDATE batch 
       SET species_id = $1, tank_id = $2, birth_date = $3,
           initial_quantity = $4, current_quantity = $5, stage = $6,
           estimated_harvest_date = $7
       WHERE batch_id = $8
       RETURNING *`,
      [species_id, tank_id, birth_date, initial_quantity, current_quantity,
       stage, estimated_harvest_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM batch WHERE batch_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    if (error.message.includes('traceability')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete batch' });
    }
  }
};

// Get batch financials
exports.getBatchFinancials = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM batch_financials WHERE batch_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        batch_id: id,
        total_feed_cost: 0,
        total_labor_cost: 0,
        water_electricity_cost: 0,
        medication_cost: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching batch financials:', error);
    res.status(500).json({ error: 'Failed to fetch batch financials' });
  }
};

// Update batch financials
exports.updateBatchFinancials = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      total_feed_cost,
      total_labor_cost,
      water_electricity_cost,
      medication_cost
    } = req.body;

    // Check if record exists
    const existing = await db.query(
      'SELECT * FROM batch_financials WHERE batch_id = $1',
      [id]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create new record
      result = await db.query(
        `INSERT INTO batch_financials 
         (batch_id, total_feed_cost, total_labor_cost, 
          water_electricity_cost, medication_cost)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, total_feed_cost || 0, total_labor_cost || 0,
         water_electricity_cost || 0, medication_cost || 0]
      );
    } else {
      // Update existing record
      result = await db.query(
        `UPDATE batch_financials 
         SET total_feed_cost = $1, total_labor_cost = $2,
             water_electricity_cost = $3, medication_cost = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE batch_id = $5
         RETURNING *`,
        [total_feed_cost, total_labor_cost, water_electricity_cost,
         medication_cost, id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating batch financials:', error);
    res.status(500).json({ error: 'Failed to update batch financials' });
  }
};

// Get batch pricing info
exports.getBatchPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM v_batch_pricing_overview WHERE batch_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found or not ready for sale' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching batch pricing:', error);
    res.status(500).json({ error: 'Failed to fetch batch pricing' });
  }
};
