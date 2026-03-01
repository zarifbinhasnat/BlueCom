/**
 * Database seed runner
 * Usage: node database/run_seed.js
 * Runs schema.sql, monthly_profit.sql, and seeds.sql in order
 */
const { Client } = require(require('path').join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const fs = require('fs');
const path = require('path');

const config = {
    user: 'postgres',
    host: 'localhost',
    password: '1234',
    port: 5432,
};

async function run() {
    // Step 1: Create database if not exists
    const adminClient = new Client({ ...config, database: 'postgres' });
    await adminClient.connect();
    try {
        await adminClient.query('CREATE DATABASE bluecon');
        console.log('✅ Created database "bluecon"');
    } catch (e) {
        if (e.code === '42P04') console.log('ℹ️  Database "bluecon" already exists');
        else throw e;
    }
    await adminClient.end();

    // Step 2: Run SQL files
    const client = new Client({ ...config, database: 'bluecon' });
    await client.connect();
    console.log('✅ Connected to bluecon');

    const files = ['schema.sql', 'monthly_profit.sql', 'seeds.sql'];
    for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping ${file} (not found)`);
            continue;
        }
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
            await client.query(sql);
            console.log(`✅ Executed ${file}`);
        } catch (e) {
            console.error(`❌ Error in ${file}:`, e.message);
        }
    }

    await client.end();
    console.log('\n🎉 Database seeding complete!');
}

run().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
