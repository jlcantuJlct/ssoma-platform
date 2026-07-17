const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function dumpColumns() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        // Get all tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        for (const row of tablesRes.rows) {
            const tableName = row.table_name;
            console.log(`\n================= TABLE: ${tableName} =================`);
            
            // Get columns info
            const colsRes = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            for (const col of colsRes.rows) {
                console.log(`  - ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable}, Default: ${col.column_default})`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

dumpColumns();
