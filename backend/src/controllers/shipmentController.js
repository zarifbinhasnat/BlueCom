const db = require('../config/db');

// Get all shipments
exports.getAllShipments = async (req, res) => {
  try {
    const { order_id, status } = req.query;
    
    let query = `
      SELECT s.*, co.order_id, c.company_name, c.country_code
      FROM shipment s
      JOIN customer_order co ON s.order_id = co.order_id
      JOIN customer c ON co.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (order_id) {
      query += ` AND s.order_id = $${paramCount}`;
      params.push(order_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY s.shipment_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
};

// Get shipment by ID with details
exports.getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get shipment details
    const shipmentResult = await db.query(
      `SELECT s.*, co.order_id, c.company_name, c.contact_person,
              c.country_code, c.address
       FROM shipment s
       JOIN customer_order co ON s.order_id = co.order_id
       JOIN customer c ON co.customer_id = c.customer_id
       WHERE s.shipment_id = $1`,
      [id]
    );
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Get shipment details (batch allocations)
    const detailsResult = await db.query(
      `SELECT sd.*, b.batch_id, s.common_name, b.birth_date,
              f.farm_name, t.tank_name
       FROM shipment_detail sd
       JOIN batch b ON sd.batch_id = b.batch_id
       JOIN species s ON b.species_id = s.species_id
       JOIN tank t ON b.tank_id = t.tank_id
       JOIN farm f ON t.farm_id = f.farm_id
       WHERE sd.shipment_id = $1`,
      [id]
    );
    
    const shipment = shipmentResult.rows[0];
    shipment.details = detailsResult.rows;
    
    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
};

// Create new shipment with batch allocations
exports.createShipment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      order_id,
      airway_bill_no,
      driver_name,
      vehicle_number,
      transport_cost,
      packaging_cost,
      details
    } = req.body;

    // Create shipment
    const shipmentResult = await client.query(
      `INSERT INTO shipment 
       (order_id, shipment_date, airway_bill_no, driver_name, vehicle_number,
        transport_cost, packaging_cost, status)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, 'preparing')
       RETURNING *`,
      [order_id, airway_bill_no, driver_name, vehicle_number,
       transport_cost || 0, packaging_cost || 0]
    );
    
    const shipment = shipmentResult.rows[0];
    
    // Create shipment details (batch allocations)
    if (details && details.length > 0) {
      for (const detail of details) {
        // Get current batch cost
        const costResult = await client.query(
          `SELECT 
             COALESCE(total_feed_cost, 0) + 
             COALESCE(total_labor_cost, 0) + 
             COALESCE(water_electricity_cost, 0) + 
             COALESCE(medication_cost, 0) as total_cost
           FROM batch_financials
           WHERE batch_id = $1`,
          [detail.batch_id]
        );
        
        const batchCost = costResult.rows.length > 0 ? costResult.rows[0].total_cost : 0;
        
        await client.query(
          `INSERT INTO shipment_detail 
           (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment)
           VALUES ($1, $2, $3, $4, $5)`,
          [shipment.shipment_id, detail.batch_id, detail.quantity_shipped,
           detail.box_label_id, batchCost]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Fetch complete shipment with details
    const completeShipment = await db.query(
      `SELECT s.*, 
              (SELECT json_agg(
                json_build_object(
                  'detail_id', sd.detail_id,
                  'batch_id', sd.batch_id,
                  'species_name', sp.common_name,
                  'quantity_shipped', sd.quantity_shipped,
                  'box_label_id', sd.box_label_id,
                  'batch_cost_at_shipment', sd.batch_cost_at_shipment
                )
              ) FROM shipment_detail sd
              JOIN batch b ON sd.batch_id = b.batch_id
              JOIN species sp ON b.species_id = sp.species_id
              WHERE sd.shipment_id = s.shipment_id) as details
       FROM shipment s
       WHERE s.shipment_id = $1`,
      [shipment.shipment_id]
    );
    
    res.status(201).json(completeShipment.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  } finally {
    client.release();
  }
};

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_delivery_date } = req.body;

    const result = await db.query(
      `UPDATE shipment 
       SET status = $1, actual_delivery_date = $2
       WHERE shipment_id = $3
       RETURNING *`,
      [status, actual_delivery_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
};

// Get traceability report for shipment
exports.getShipmentTraceability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM v_traceability_report WHERE shipment_id = $1`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching traceability:', error);
    res.status(500).json({ error: 'Failed to fetch traceability' });
  }
};
