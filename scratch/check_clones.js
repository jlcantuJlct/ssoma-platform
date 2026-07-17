require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT 
                SUM(CASE WHEN record_id ~ '^[0-9]+$' THEN 1 ELSE 0 END) as numeric_clones,
                SUM(CASE WHEN record_id !~ '^[0-9]+$' THEN 1 ELSE 0 END) as original_records
            FROM desvio_evidence_records
        `);
        console.log(res.rows[0]);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
