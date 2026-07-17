// Set env vars from .env.local manually
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testAppDb() {
    console.log("Testing standard pg Pool with connection string:", process.env.POSTGRES_URL);
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    try {
        const res = await pool.query("SELECT count(*) as c FROM personnel");
        console.log("SUCCESS! Query result:", res.rows[0]);
    } catch (e) {
        console.error("FAILURE running query through standard pg Pool:", e);
    } finally {
        await pool.end();
    }
}

testAppDb();
