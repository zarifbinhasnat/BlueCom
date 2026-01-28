const db = require('../config/db');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity, farm_id } = req.query;
    
    let query = `
      SELECT a.*, t.tank_name, f.farm_name, b.batch_id, s.common_name as species_name
      FROM alert a
      LEFT JOIN tank t ON a.tank_id = t.tank_id
      LEFT JOIN farm f ON t.farm_id = f.farm_id
      LEFT JOIN batch b ON a.batch_id = b.batch_id
      LEFT JOIN species s ON b.species_id = s.species_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (severity) {
      query += ` AND a.severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }
    
    if (farm_id) {
      query += ` AND f.farm_id = $${paramCount}`;
      params.push(farm_id);
      paramCount++;
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Get active biosecurity alerts
exports.getBiosecurityAlerts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_active_biosecurity_alerts');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching biosecurity alerts:', error);
    res.status(500).json({ error: 'Failed to fetch biosecurity alerts' });
  }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolved_by } = req.body;

    let query, params;
    
    if (status === 'resolved') {
      query = `
        UPDATE alert 
        SET status = $1, resolved_at = CURRENT_TIMESTAMP, resolved_by = $2
        WHERE alert_id = $3
        RETURNING *
      `;
      params = [status, resolved_by, id];
    } else {
      query = `
        UPDATE alert 
        SET status = $1
        WHERE alert_id = $2
        RETURNING *
      `;
      params = [status, id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

// Get species mortality analysis
exports.getMortalityAnalysis = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_species_mortality_analysis');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mortality analysis:', error);
    res.status(500).json({ error: 'Failed to fetch mortality analysis' });
  }
};

// Get high risk batches
exports.getHighRiskBatches = async (req, res) => {
  try {
    const { threshold } = req.query;
    const mortalityThreshold = threshold || 20.0;
    
    const result = await db.query(
      'SELECT * FROM get_high_risk_batches($1)',
      [mortalityThreshold]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching high risk batches:', error);
    res.status(500).json({ error: 'Failed to fetch high risk batches' });
  }
};

// Get batch traceability
exports.getBatchTraceability = async (req, res) => {
  try {
    const { batch_id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM get_batch_traceability($1)',
      [batch_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching batch traceability:', error);
    res.status(500).json({ error: 'Failed to fetch batch traceability' });
  }
};

// Get traceability report
exports.getTraceabilityReport = async (req, res) => {
  try {
    const { shipment_id, customer_id, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM v_traceability_report WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (shipment_id) {
      query += ` AND shipment_id = $${paramCount}`;
      params.push(shipment_id);
      paramCount++;
    }
    
    if (customer_id) {
      // Need to join to get customer_id from customer table
      query = query.replace('WHERE 1=1', 
        'JOIN customer c ON v_traceability_report.customer_name = c.company_name WHERE 1=1');
      query += ` AND c.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND shipment_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND shipment_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching traceability report:', error);
    res.status(500).json({ error: 'Failed to fetch traceability report' });
  }
};

// Get batch pricing overview
exports.getBatchPricingOverview = async (req, res) => {
  try {
    const { farm_id, species_id } = req.query;
    
    let query = 'SELECT * FROM v_batch_pricing_overview WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (farm_id) {
      // Need a way to filter by farm_id - view doesn't have farm_id exposed
      // For now, filter by farm_name match
      query += ` AND farm_name IN (SELECT farm_name FROM farm WHERE farm_id = $${paramCount})`;
      params.push(farm_id);
      paramCount++;
    }
    
    if (species_id) {
      // Similar issue - filter by species name
      query += ` AND species IN (SELECT common_name FROM species WHERE species_id = $${paramCount})`;
      params.push(species_id);
      paramCount++;
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batch pricing overview:', error);
    res.status(500).json({ error: 'Failed to fetch batch pricing overview' });
  }
};

// Calculate selling price for batch
exports.calculateSellingPrice = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { transport_cost, packaging_cost } = req.query;
    
    const result = await db.query(
      'SELECT calculate_selling_price($1, $2, $3) as selling_price',
      [batch_id, transport_cost || 0, packaging_cost || 0]
    );
    
    res.json({
      batch_id: parseInt(batch_id),
      selling_price: result.rows[0].selling_price,
      transport_cost: parseFloat(transport_cost || 0),
      packaging_cost: parseFloat(packaging_cost || 0)
    });
  } catch (error) {
    console.error('Error calculating selling price:', error);
    res.status(500).json({ error: 'Failed to calculate selling price' });
  }
};
