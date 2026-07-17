require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query("SELECT month, personnel_list FROM sctr_monthly_records");
        res.rows.forEach(r => {
            const lines = r.personnel_list.split('\n');
            const matchLines = lines.filter(l => l.toUpperCase().includes('MANRIQUE REYES'));
            if (matchLines.length > 0) {
                console.log(`\n--- ${r.month} ---`);
                matchLines.forEach(l => console.log(l));
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
