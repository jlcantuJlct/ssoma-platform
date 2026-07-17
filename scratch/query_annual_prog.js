require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const result = await pool.query(`SELECT * FROM annual_program LIMIT 2`);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
