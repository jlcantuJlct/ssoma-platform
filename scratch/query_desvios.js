require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

pool.query("SELECT responsible, description, location FROM desvio_evidence_records WHERE to_char(created_at, 'YYYY-MM') = '2026-06' LIMIT 10")
    .then(res => {
        console.log(res.rows);
        return pool.query("SELECT COUNT(*) as exact_count, COUNT(DISTINCT record_id) as unique_records FROM desvio_evidence_records WHERE to_char(created_at, 'YYYY-MM') = '2026-06'");
    })
    .then(res => {
        console.log(res.rows);
        pool.end();
    })
    .catch(e => {
        console.error(e);
        pool.end();
    });
