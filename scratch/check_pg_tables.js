const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkPg() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected to PostgreSQL (Neon)");
        
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in public schema:");
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT count(*) as c FROM "${row.table_name}"`);
            console.log(`- ${row.table_name}: ${countRes.rows[0].c} rows`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkPg();
