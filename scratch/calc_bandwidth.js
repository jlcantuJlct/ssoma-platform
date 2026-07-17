require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function getTableSize(tableName) {
    try {
        const res = await pool.query(`SELECT * FROM ${tableName}`);
        const jsonString = JSON.stringify(res.rows);
        return jsonString.length; // rough byte size
    } catch(e) {
        return 0;
    }
}

async function run() {
    let totalBytes = 0;
    const tables = [
        'annual_program', 'inspection_records', 'hhc_records', 
        'evidence_center_records', 'pma_records', 'ats_records', 
        'petar_records', 'desvio_records', 'simulacro_records', 
        'brigadista_records', 'risstma_records', 'reporte_ac_records'
    ];
    
    console.log("Calculando peso de cada consulta para la página Programa Anual...");
    for (let t of tables) {
        let size = await getTableSize(t);
        console.log(`${t}: ${(size / 1024).toFixed(2)} KB`);
        totalBytes += size;
    }
    
    const mb = totalBytes / (1024 * 1024);
    console.log(`\nTOTAL POR CARGA DE PÁGINA: ${mb.toFixed(2)} MB`);
    
    // Estimate for 100 loads/month
    console.log(`Si 1 usuario abre la página 3 veces al día (90 al mes): ${(mb * 90).toFixed(2)} MB al mes.`);
    console.log(`Si 5 usuarios abren la página 3 veces al día (450 al mes): ${(mb * 450).toFixed(2)} MB al mes.`);
    pool.end();
}
run();
