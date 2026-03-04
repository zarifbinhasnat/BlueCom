const db = require('../config/db');

// Get health logs
exports.getHealthLogs = async (req, res) => {
  try {
    const { batch_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT hl.*, b.batch_id, s.common_name, u.username as recorded_by_name
      FROM health_log hl
      JOIN batch b ON hl.batch_id = b.batch_id
      JOIN species s ON b.species_id = s.species_id
      LEFT JOIN app_user u ON hl.recorded_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (batch_id) {
      query += ` AND hl.batch_id = $${paramCount}`;
      params.push(batch_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND hl.log_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND hl.log_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY hl.log_date DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching health logs:', error);
    res.status(500).json({ error: 'Failed to fetch health logs' });
  }
};

// Create health log
exports.createHealthLog = async (req, res) => {
  try {
    const {
      batch_id,
      condition_notes,
      treatment_applied,
      mortality_count,
      recorded_by
    } = req.body;

    const result = await db.query(
      `INSERT INTO health_log 
       (batch_id, condition_notes, treatment_applied, mortality_count, 
        recorded_by, log_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
       RETURNING *`,
      [batch_id, condition_notes, treatment_applied, mortality_count || 0, recorded_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating health log:', error);
    res.status(500).json({ error: 'Failed to create health log' });
  }
};

// Get health summary for batch
exports.getHealthSummary = async (req, res) => {
  try {
    const { batch_id } = req.params;
    
    const result = await db.query(
      `SELECT 
         batch_id,
         COUNT(*) as total_health_logs,
         SUM(mortality_count) as total_deaths,
         COUNT(CASE WHEN condition_notes IS NOT NULL THEN 1 END) as disease_events,
         MIN(log_date) as first_log,
         MAX(log_date) as last_log
       FROM health_log
       WHERE batch_id = $1
       GROUP BY batch_id`,
      [batch_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        batch_id,
        total_health_logs: 0,
        total_deaths: 0,
        disease_events: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching health summary:', error);
    res.status(500).json({ error: 'Failed to fetch health summary' });
  }
};
