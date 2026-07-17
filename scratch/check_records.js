require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        let res = await pool.query(`SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) FROM desvio_evidence_records GROUP BY month`);
        console.log("Counts by month in DB:", res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
