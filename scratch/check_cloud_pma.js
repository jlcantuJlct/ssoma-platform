const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCloudData() {
    console.log("🛰️ Consultando base de datos de Vercel (Cloud)...");
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT SUBSTR(date, 1, 7) as month, COUNT(*) as count FROM pma_evidence_records GROUP BY month ORDER BY month DESC");
        console.log("📊 Distribución de registros en la NUBE:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("❌ Error en Cloud:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkCloudData();
