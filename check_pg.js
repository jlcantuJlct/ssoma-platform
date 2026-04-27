const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

async function check() {
    try {
        console.log("--- ATS RECORDS (POSTGRES) ---");
        const ats = await pool.query("SELECT * FROM ats_records ORDER BY date DESC LIMIT 5");
        console.log(ats.rows);

        console.log("--- HHC RECORDS (POSTGRES) ---");
        const hhc = await pool.query("SELECT * FROM hhc_records ORDER BY date DESC LIMIT 5");
        console.log(hhc.rows);

        console.log("--- INSPECTION RECORDS (POSTGRES) ---");
        const insp = await pool.query("SELECT * FROM inspection_records ORDER BY date DESC LIMIT 5");
        console.log(insp.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
