const db = require('../config/db');

// Get water logs
exports.getWaterLogs = async (req, res) => {
  try {
    const { tank_id, start_date, end_date, status } = req.query;
    
    let query = `
      SELECT wl.*, t.tank_name, f.farm_name, u.username as measured_by
      FROM water_log wl
      JOIN tank t ON wl.tank_id = t.tank_id
      JOIN farm f ON t.farm_id = f.farm_id
      LEFT JOIN app_user u ON wl.measured_by_user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (tank_id) {
      query += ` AND wl.tank_id = $${paramCount}`;
      params.push(tank_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND wl.measured_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND wl.measured_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (status) {
      query += ` AND wl.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY wl.measured_at DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching water logs:', error);
    res.status(500).json({ error: 'Failed to fetch water logs' });
  }
};

// Create water log
exports.createWaterLog = async (req, res) => {
  try {
    const {
      tank_id,
      ph_level,
      temperature,
      dissolved_oxygen,
      ammonia_level,
      measured_by_user_id
    } = req.body;

    const result = await db.query(
      `INSERT INTO water_log 
       (tank_id, ph_level, temperature, dissolved_oxygen, 
        ammonia_level, measured_by_user_id, measured_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [tank_id, ph_level, temperature, dissolved_oxygen, 
       ammonia_level, measured_by_user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating water log:', error);
    res.status(500).json({ error: 'Failed to create water log' });
  }
};

// Check water quality compliance
exports.checkWaterCompliance = async (req, res) => {
  try {
    const { tank_id } = req.params;
    const result = await db.query(
      'SELECT * FROM check_water_quality_compliance($1)',
      [tank_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error checking water compliance:', error);
    res.status(500).json({ error: 'Failed to check water compliance' });
  }
};
