require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        let res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
        console.log("Tablas en la BD:", res.rows.map(r => r.table_name));
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
