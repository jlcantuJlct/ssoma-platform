const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function dumpInspectionColumns() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'inspection_records'
        `);
        console.log("inspection_records columns:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
dumpInspectionColumns();
