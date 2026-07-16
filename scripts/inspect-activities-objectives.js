const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        
        console.log("=== SUPABASE ACTIVITIES DISTINCT OBJECTIVE_IDS ===");
        const res = await client.query("SELECT DISTINCT objective_id FROM activities");
        console.log(res.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
inspect();
