const db = require('../config/db');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    
    let query = `
      SELECT co.*, c.company_name, c.country_code
      FROM customer_order co
      JOIN customer c ON co.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (customer_id) {
      query += ` AND co.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND co.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY co.order_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID with items
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const orderResult = await db.query(
      `SELECT co.*, c.company_name, c.contact_person, c.contact_email,
              c.country_code, c.address
       FROM customer_order co
       JOIN customer c ON co.customer_id = c.customer_id
       WHERE co.order_id = $1`,
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.*, s.common_name, s.scientific_name
       FROM order_item oi
       JOIN species s ON oi.species_id = s.species_id
       WHERE oi.order_id = $1`,
      [id]
    );
    
    const order = orderResult.rows[0];
    order.items = itemsResult.rows;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Create new order with items
exports.createOrder = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_id,
      delivery_address,
      currency_code,
      created_by,
      notes,
      items
    } = req.body;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO customer_order 
       (customer_id, order_date, status, total_value, currency_code,
        delivery_address, created_by, notes)
       VALUES ($1, CURRENT_DATE, 'pending', 0, $2, $3, $4, $5)
       RETURNING *`,
      [customer_id, currency_code || 'USD', delivery_address, created_by, notes]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_item 
           (order_id, species_id, quantity_requested, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.order_id, item.species_id, item.quantity_requested, item.unit_price]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Fetch complete order with items
    const completeOrder = await db.query(
      `SELECT co.*, 
              (SELECT json_agg(
                json_build_object(
                  'item_id', oi.item_id,
                  'species_id', oi.species_id,
                  'species_name', s.common_name,
                  'quantity_requested', oi.quantity_requested,
                  'unit_price', oi.unit_price,
                  'line_total', oi.line_total
                )
              ) FROM order_item oi
              JOIN species s ON oi.species_id = s.species_id
              WHERE oi.order_id = co.order_id) as items
       FROM customer_order co
       WHERE co.order_id = $1`,
      [order.order_id]
    );
    
    res.status(201).json(completeOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE customer_order 
       SET status = $1
       WHERE order_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM customer_order WHERE order_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
