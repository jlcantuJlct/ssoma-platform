require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Iniciando limpieza final de duplicados...");
        
        // Remove created_at::date from GROUP BY to remove cross-day clones
        const query = `
            DELETE FROM desvio_evidence_records
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM desvio_evidence_records
                GROUP BY responsible, date, location, category, description
            );
        `;
        
        const res = await pool.query(query);
        console.log(`Borrados ${res.rowCount} registros duplicados de días cruzados.`);
        
        let counts = await pool.query(`SELECT SUBSTRING(date FROM 1 FOR 7) as month, COUNT(*) FROM desvio_evidence_records GROUP BY month`);
        console.log("Counts after strict cleanup:", counts.rows);
    } catch(e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}
run();
