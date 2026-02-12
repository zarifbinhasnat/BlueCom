const db = require('../config/db');

// Get all farms
exports.getAllFarms = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT farm_id, farm_name, location, license_number, manager_name, 
              phone, total_capacity_liters, established_date
       FROM farm 
       ORDER BY farm_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
};

// Get farm by ID
exports.getFarmById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM farm WHERE farm_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching farm:', error);
    res.status(500).json({ error: 'Failed to fetch farm' });
  }
};

// Create new farm
exports.createFarm = async (req, res) => {
  try {
    const {
      farm_name,
      location,
      license_number,
      manager_name,
      phone,
      total_capacity_liters,
      established_date
    } = req.body;

    const result = await db.query(
      `INSERT INTO farm 
       (farm_name, location, license_number, manager_name, phone, 
        total_capacity_liters, established_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [farm_name, location, license_number, manager_name, phone,
       total_capacity_liters, established_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({ error: 'Failed to create farm' });
  }
};

// Update farm
exports.updateFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      farm_name,
      location,
      license_number,
      manager_name,
      phone,
      total_capacity_liters,
      established_date
    } = req.body;

    const result = await db.query(
      `UPDATE farm 
       SET farm_name = $1, location = $2, license_number = $3,
           manager_name = $4, phone = $5, total_capacity_liters = $6,
           established_date = $7
       WHERE farm_id = $8
       RETURNING *`,
      [farm_name, location, license_number, manager_name, phone,
       total_capacity_liters, established_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating farm:', error);
    res.status(500).json({ error: 'Failed to update farm' });
  }
};

// Delete farm
exports.deleteFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM farm WHERE farm_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ error: 'Failed to delete farm' });
  }
};

// Get farm performance summary
exports.getFarmPerformance = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_farm_performance_summary');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching farm performance:', error);
    res.status(500).json({ error: 'Failed to fetch farm performance' });
  }
};
