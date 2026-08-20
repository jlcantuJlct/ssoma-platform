const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const res = await pool.query('SELECT * FROM inspection_records ORDER BY date DESC LIMIT 2');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch(err) {
        console.error("CAUGHT ERROR:", err);
        process.exit(1);
    }
}
run();
