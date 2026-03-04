const db = require('../config/db');

// Get all tanks
exports.getAllTanks = async (req, res) => {
  try {
    const { farm_id } = req.query;
    
    let query = `
      SELECT t.*, f.farm_name 
      FROM tank t
      JOIN farm f ON t.farm_id = f.farm_id
    `;
    const params = [];
    
    if (farm_id) {
      query += ' WHERE t.farm_id = $1';
      params.push(farm_id);
    }
    
    query += ' ORDER BY f.farm_name, t.tank_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tanks:', error);
    res.status(500).json({ error: 'Failed to fetch tanks' });
  }
};

// Get tank by ID
exports.getTankById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT t.*, f.farm_name 
       FROM tank t
       JOIN farm f ON t.farm_id = f.farm_id
       WHERE t.tank_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching tank:', error);
    res.status(500).json({ error: 'Failed to fetch tank' });
  }
};

// Create new tank
exports.createTank = async (req, res) => {
  try {
    const {
      farm_id,
      tank_name,
      tank_type,
      volume_liters,
      is_active
    } = req.body;

    const result = await db.query(
      `INSERT INTO tank 
       (farm_id, tank_name, tank_type, volume_liters, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [farm_id, tank_name, tank_type, volume_liters, is_active !== undefined ? is_active : true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tank:', error);
    res.status(500).json({ error: 'Failed to create tank' });
  }
};

// Update tank
exports.updateTank = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      farm_id,
      tank_name,
      tank_type,
      volume_liters,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE tank 
       SET farm_id = $1, tank_name = $2, tank_type = $3,
           volume_liters = $4, is_active = $5
       WHERE tank_id = $6
       RETURNING *`,
      [farm_id, tank_name, tank_type, volume_liters, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tank:', error);
    res.status(500).json({ error: 'Failed to update tank' });
  }
};

// Delete tank
exports.deleteTank = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM tank WHERE tank_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }

    res.json({ message: 'Tank deleted successfully' });
  } catch (error) {
    console.error('Error deleting tank:', error);
    res.status(500).json({ error: 'Failed to delete tank' });
  }
};
