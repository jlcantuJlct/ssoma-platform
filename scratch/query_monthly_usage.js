require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const tables = [
        'annual_program', 'inspection_records', 'hhc_records', 
        'evidence_center_records', 'pma_records', 'ats_records', 
        'petar_records', 'desvio_records', 'simulacro_records', 
        'brigadista_records', 'risstma_records', 'reporte_ac_records'
    ];
    
    console.log("Registros por mes en las herramientas:");
    for (const table of tables) {
        try {
            // Some tables might use 'created_at' and some might use 'date'. Let's try created_at first.
            const query = `
                SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) as count 
                FROM ${table} 
                GROUP BY month 
                ORDER BY month
            `;
            const res = await pool.query(query);
            if (res.rows.length > 0) {
                console.log(`\n--- Herramienta: ${table} ---`);
                res.rows.forEach(r => {
                    console.log(`Mes: ${r.month} | Registros creados: ${r.count}`);
                });
            }
        } catch(e) {
            // fallback if created_at doesn't exist
        }
    }
    pool.end();
}
run();
