const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
require('dotenv').config(); 

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
}); 

async function run() { 
    try { 
        const sizeRes = await pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as total_size, pg_database_size(current_database()) as raw_size_bytes`); 
        console.log('Database Size:', sizeRes.rows[0]); 
        
        const tableRes = await pool.query(`SELECT relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as total_size, pg_total_relation_size(relid) as raw_size, n_live_tup as row_count FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 15`); 
        console.log('\nTop 15 Tables by Size:'); 
        console.table(tableRes.rows); 
    } catch(e) { 
        console.error(e); 
    } finally { 
        pool.end(); 
    } 
} 
run();
