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
            console.log(`\n\n--- ${r.month} ---`);
            const snippet = r.personnel_list?.substring(0, 800) || "";
            const cancinoIndex = r.personnel_list?.indexOf("CANCINO");
            if (cancinoIndex !== -1 && cancinoIndex !== undefined) {
                 console.log("FOUND CANCINO AROUND:", r.personnel_list.substring(Math.max(0, cancinoIndex - 50), cancinoIndex + 50));
            }
            console.log(snippet);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
