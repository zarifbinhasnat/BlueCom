const db = require('../config/db');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM customer ORDER BY company_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM customer WHERE customer_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      contact_email,
      phone,
      address,
      country_code,
      import_license_no
    } = req.body;

    const result = await db.query(
      `INSERT INTO customer 
       (company_name, contact_person, contact_email, phone, address, 
        country_code, import_license_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [company_name, contact_person, contact_email, phone, address,
       country_code, import_license_no]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      contact_person,
      contact_email,
      phone,
      address,
      country_code,
      import_license_no
    } = req.body;

    const result = await db.query(
      `UPDATE customer 
       SET company_name = $1, contact_person = $2, contact_email = $3,
           phone = $4, address = $5, country_code = $6, import_license_no = $7
       WHERE customer_id = $8
       RETURNING *`,
      [company_name, contact_person, contact_email, phone, address,
       country_code, import_license_no, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM customer WHERE customer_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
