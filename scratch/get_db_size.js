require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size_pretty,
                   pg_database_size(current_database()) / 1024 / 1024 as size_mb;
        `);
        console.log("DB Size:", res.rows[0]);
    } catch(e) {
        console.error("Error connecting to DB:", e);
    } finally {
        pool.end();
    }
}
run();
