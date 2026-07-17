require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT * FROM sctr_monthly_records WHERE month = 'Julio'");
        console.log(JSON.stringify(res.rows.map(r => ({ ...r, personnel_list: r.personnel_list?.substring(0, 1000) + '...' })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
