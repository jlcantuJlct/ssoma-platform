require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const result = await pool.query(`
            SELECT acto, condicion, cantidad, date 
            FROM reporte_ac_records 
            WHERE date >= '2026-01-01' AND date <= '2026-03-31'
        `);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
