require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query("SELECT month, personnel_list FROM sctr_monthly_records WHERE month = 'Julio'");
        const text = res.rows[0].personnel_list;
        console.log(text.substring(0, 1500));
        console.log("...");
        console.log("CE matches:", text.match(/CE\s+\d+/g));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
