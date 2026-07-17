require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // Query all table names in Postgres public schema
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log("Postgres Tables:", res.rows.map(r => r.table_name));
        
        // Also check if there's usage data in export_requests or similar
        const tables = res.rows.map(r => r.table_name);
        
        console.log("\nRegistros por mes en TODAS las tablas:");
        for (const table of tables) {
            try {
                // Try created_at
                let query = `SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) as count FROM ${table} GROUP BY month ORDER BY month`;
                let counts = await pool.query(query);
                
                if (counts.rows.length > 0) {
                    console.log(`\n--- ${table} ---`);
                    counts.rows.forEach(r => console.log(`Mes: ${r.month} | Registros: ${r.count}`));
                }
            } catch(e) {
                try {
                    // Try date if created_at fails
                    let query = `SELECT to_char(date::date, 'YYYY-MM') as month, COUNT(*) as count FROM ${table} GROUP BY month ORDER BY month`;
                    let counts = await pool.query(query);
                    if (counts.rows.length > 0) {
                        console.log(`\n--- ${table} ---`);
                        counts.rows.forEach(r => console.log(`Mes: ${r.month} | Registros: ${r.count}`));
                    }
                } catch(e2) {}
            }
        }
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
