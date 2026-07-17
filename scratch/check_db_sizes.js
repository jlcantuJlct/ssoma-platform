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
                relname as "table",
                n_live_tup as "records"
            FROM 
                pg_stat_user_tables 
            ORDER BY 
                n_live_tup DESC;
        `);
        console.log("=== RECORD COUNTS PER TABLE ===");
        console.table(res.rows);
    } catch(e) {
        console.error("Error connecting to DB:", e);
    } finally {
        pool.end();
    }
}
run();
