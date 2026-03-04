const db = require('../config/db');

// Get feeding logs
exports.getFeedingLogs = async (req, res) => {
  try {
    const { batch_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT fl.*, b.batch_id, s.common_name, u.username as recorded_by_name
      FROM feeding_log fl
      JOIN batch b ON fl.batch_id = b.batch_id
      JOIN species s ON b.species_id = s.species_id
      LEFT JOIN app_user u ON fl.recorded_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (batch_id) {
      query += ` AND fl.batch_id = $${paramCount}`;
      params.push(batch_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND fl.feed_time >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND fl.feed_time <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY fl.feed_time DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feeding logs:', error);
    res.status(500).json({ error: 'Failed to fetch feeding logs' });
  }
};

// Create feeding log
exports.createFeedingLog = async (req, res) => {
  try {
    const {
      batch_id,
      food_type,
      amount_grams,
      cost_per_kg,
      recorded_by,
      notes
    } = req.body;

    const result = await db.query(
      `INSERT INTO feeding_log 
       (batch_id, food_type, amount_grams, cost_per_kg, recorded_by, notes, feed_time)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [batch_id, food_type, amount_grams, cost_per_kg, recorded_by, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating feeding log:', error);
    res.status(500).json({ error: 'Failed to create feeding log' });
  }
};

// Get feeding summary for batch
exports.getFeedingSummary = async (req, res) => {
  try {
    const { batch_id } = req.params;
    
    const result = await db.query(
      `SELECT 
         batch_id,
         COUNT(*) as total_feedings,
         SUM(amount_grams) as total_grams,
         ROUND(SUM(amount_grams / 1000.0 * cost_per_kg), 2) as total_cost,
         MIN(feed_time) as first_feeding,
         MAX(feed_time) as last_feeding
       FROM feeding_log
       WHERE batch_id = $1
       GROUP BY batch_id`,
      [batch_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        batch_id,
        total_feedings: 0,
        total_grams: 0,
        total_cost: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching feeding summary:', error);
    res.status(500).json({ error: 'Failed to fetch feeding summary' });
  }
};
