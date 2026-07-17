require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        let res = await pool.query(`SELECT id, responsible, date, images FROM desvio_evidence_records`);
        console.log(res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
