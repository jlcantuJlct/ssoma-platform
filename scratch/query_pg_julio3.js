require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query("SELECT month, personnel_list FROM sctr_monthly_records WHERE month = 'Julio'");
        res.rows.forEach(r => {
            const lines = r.personnel_list.split('\n');
            const matchLines = lines.filter(l => l.toUpperCase().includes('JULIO'));
            if (matchLines.length > 0) {
                console.log(`\n--- ${r.month} ---`);
                matchLines.forEach(l => {
                    const matchIdx = l.toUpperCase().indexOf('JULIO');
                    console.log(l.substring(Math.max(0, matchIdx - 40), matchIdx + 40));
                });
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
