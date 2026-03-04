const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: 'YOUR_PASSWORD_HERE', // CHANGE THIS!
  port: 5432,
});

async function createDatabase() {
  try {
    // First check if database exists
    const checkDb = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'bluecon'"
    );
    
    if (checkDb.rows.length === 0) {
      console.log('Creating database bluecon...');
      await pool.query('CREATE DATABASE bluecon');
      console.log('✓ Database created successfully');
    } else {
      console.log('✓ Database bluecon already exists');
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  }
}

async function runSQLFile(filePath, dbPool) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`\nExecuting: ${path.basename(filePath)}...`);
    await dbPool.query(sql);
    console.log(`✓ ${path.basename(filePath)} executed successfully`);
  } catch (error) {
    console.error(`✗ Error in ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

async function setupDatabase() {
  let blueconPool;
  
  try {
    // Step 1: Create database
    await createDatabase();
    await pool.end();
    
    // Step 2: Connect to bluecon database
    blueconPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'bluecon',
      password: 'YOUR_PASSWORD_HERE', // CHANGE THIS!
      port: 5432,
    });
    
    console.log('\n=== Running SQL Scripts ===\n');
    
    // Step 3: Run SQL files in order
    const sqlFiles = [
      'database/schema.sql',
      'database/feed_cost_auto_update.sql',
      'database/triggers.sql',
      'database/business_logic.sql',
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        await runSQLFile(filePath, blueconPool);
      } else {
        console.warn(`⚠ File not found: ${file}`);
      }
    }
    
    // Optional: Run seeds if exists
    const seedsPath = path.join(__dirname, '..', 'database/seeds.sql');
    if (fs.existsSync(seedsPath)) {
      console.log('\nFound seeds.sql file...');
      await runSQLFile(seedsPath, blueconPool);
    }
    
    console.log('\n✓✓✓ Database setup completed successfully! ✓✓✓\n');
    console.log('You can now start the backend server with: npm run dev');
    
  } catch (error) {
    console.error('\n✗✗✗ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (blueconPool) {
      await blueconPool.end();
    }
  }
}

// Run setup
setupDatabase();
