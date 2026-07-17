require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const result = await pool.query(`SELECT * FROM annual_program`);
        let programadas = 0;
        let ejecutadas = 0;

        for (const row of result.rows) {
            if (!row.data_json) continue;
            let data = [];
            try {
                data = JSON.parse(row.data_json);
            } catch (e) { continue; }
            
            for (const item of data) {
                // Check if date is in Jan, Feb, Mar of 2026
                if (item.date && item.date.startsWith('2026-01') || item.date.startsWith('2026-02') || item.date.startsWith('2026-03')) {
                    programadas++;
                    // Check status or compliance
                    if (item.status === 'Ejecutado' || item.status === 'Completado' || item.compliance === 100 || item.compliance === 1) {
                        ejecutadas++;
                    }
                }
            }
        }
        
        console.log("Programadas:", programadas);
        console.log("Ejecutadas:", ejecutadas);
        
        if (programadas > 0) {
            console.log("% Cumplimiento:", ((ejecutadas / programadas) * 100).toFixed(2) + "%");
        } else {
            console.log("% Cumplimiento: N/A");
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
