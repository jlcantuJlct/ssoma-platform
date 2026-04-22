
const { createPool } = require('@vercel/postgres');
const path = require('path');
// Fix path to .env.local
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

async function debugProgram() {
    try {
        console.log("--- BUSCANDO ULTIMAS 10 INSPECCIONES EN POSTGRES ---");
        const { rows: records } = await pool.query('SELECT inspection_type, date FROM inspection_records ORDER BY date DESC LIMIT 10');
        
        if (records.length === 0) {
            console.log("❌ No se encontraron registros.");
        } else {
            records.forEach(r => {
                console.log(`Tipo: [${r.inspection_type}] | Fecha: [${r.date}]`);
            });
        }

        console.log("\n--- BUSCANDO ULTIMOS 5 HHC ---");
        const { rows: hhc } = await pool.query('SELECT tema, date FROM hhc_records ORDER BY date DESC LIMIT 5');
        hhc.forEach(r => {
            console.log(`Tema: [${r.tema}] | Fecha: [${r.date}]`);
        });

    } catch (e) {
        console.error("Error (Check .env.local contents):", e.message);
    } finally {
        await pool.end();
    }
}

debugProgram();
