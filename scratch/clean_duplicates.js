require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Iniciando limpieza de duplicados...");
        
        // Find duplicate IDs to delete
        // We keep the MIN(id) for each identical group
        const query = `
            DELETE FROM desvio_evidence_records
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM desvio_evidence_records
                GROUP BY responsible, date, location, category, description, created_at::date
            );
        `;
        
        const res = await pool.query(query);
        console.log(`Borrados ${res.rowCount} registros duplicados.`);
    } catch(e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}
run();
