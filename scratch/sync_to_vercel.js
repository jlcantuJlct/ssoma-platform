const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const localDb = new Database(path.join(process.cwd(), 'ssoma.db'));

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function syncLocalToCloud() {
    console.log("🔄 Iniciando sincronización de rescate hacia Vercel Postgres...");

    const localRecords = localDb.prepare("SELECT * FROM pma_evidence_records").all();
    console.log(`📋 Registros locales leídos: ${localRecords.length}`);

    let synced = 0;
    const client = await pool.connect();

    try {
        for (const r of localRecords) {
            const sql = `
                INSERT INTO pma_evidence_records (id, record_id, date, responsible, category, description, location, images)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO UPDATE SET
                    date = EXCLUDED.date,
                    responsible = EXCLUDED.responsible,
                    category = EXCLUDED.category,
                    description = EXCLUDED.description,
                    location = EXCLUDED.location,
                    images = EXCLUDED.images
            `;
            
            await client.query(sql, [
                r.id,
                r.record_id,
                r.date,
                r.responsible,
                r.category,
                r.description,
                r.location,
                r.images
            ]);
            synced++;
        }
        console.log(`✅ ¡Sincronización exitosa! ${synced} registros actualizados en Vercel.`);
    } catch (err) {
        console.error("❌ Error sincronizando:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

syncLocalToCloud();
