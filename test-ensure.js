const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inspection_records (
                id INT PRIMARY KEY,
                date VARCHAR(50),
                responsible VARCHAR(100),
                inspection_type VARCHAR(200),
                area VARCHAR(50),
                zone VARCHAR(100),
                status VARCHAR(50),
                observations TEXT,
                evidence_pdf TEXT,
                evidence_imgs TEXT
            )
        `);
        console.log("ensure table 1 succeeded");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS monthly_program_records (
                id VARCHAR(50) PRIMARY KEY,
                responsible VARCHAR(100),
                type VARCHAR(200),
                quantity INT,
                month INT,
                area VARCHAR(50)
            )
        `);
        console.log("ensure table 2 succeeded");
        process.exit(0);
    } catch(err) {
        console.error("CAUGHT ERROR:", err.message);
        process.exit(1);
    }
}
run();
