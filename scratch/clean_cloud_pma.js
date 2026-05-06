const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanAndSync() {
    console.log("🧹 Iniciando Limpieza y Sincronización Maestra...");
    const client = await pool.connect();
    
    try {
        const today = await client.query("SELECT id FROM pma_evidence_records WHERE date LIKE '2026-05-06%'");
        console.log(`📅 Registros hoy: ${today.rows.length}`);

        // Borrar registros de Abril que están vacíos en la nube
        const deleteRes = await client.query("DELETE FROM pma_evidence_records WHERE date LIKE '2026-04%' AND (images = '[]' OR images IS NULL)");
        console.log(`🗑️ Registros vacíos de Abril borrados: ${deleteRes.rowCount}`);

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanAndSync();
