const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
require('dotenv').config(); 
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 
async function run() { 
    try { 
        const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_records'`); 
        console.table(res.rows); 
    } finally { 
        pool.end(); 
    } 
} 
run();
