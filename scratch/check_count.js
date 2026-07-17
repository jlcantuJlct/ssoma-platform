require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        let res = await pool.query(`SELECT count(*) FROM desvio_evidence_records`);
        console.log("Current DB Count:", res.rows[0]);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
