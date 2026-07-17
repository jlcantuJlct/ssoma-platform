require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // Let's check some possible alternative tables for Feb/Mar records
        const queries = [
            "SELECT 'reporte_ac_records' as tbl, SUBSTRING(date FROM 1 FOR 7) as month, COUNT(*) FROM reporte_ac_records GROUP BY month",
            "SELECT 'evidence' as tbl, SUBSTRING(date FROM 1 FOR 7) as month, COUNT(*) FROM evidence WHERE category ILIKE '%desvio%' GROUP BY month",
            "SELECT 'activities' as tbl, SUBSTRING(date FROM 1 FOR 7) as month, COUNT(*) FROM activities WHERE category ILIKE '%desvio%' GROUP BY month"
        ];
        
        for (let q of queries) {
            try {
                let res = await pool.query(q);
                console.log(res.rows);
            } catch(e) { /* ignore missing tables/columns */ }
        }
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
