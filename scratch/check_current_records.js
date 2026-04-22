const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function checkCurrentRecords() {
    const pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });

    console.log("Consultando tipos de inspección existentes en el historial...");
    
    try {
        const result = await pool.query("SELECT DISTINCT inspection_type, area FROM inspection_records");
        console.log("Tipos encontrados en el historial:");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

checkCurrentRecords();
