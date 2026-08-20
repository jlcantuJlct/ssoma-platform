const { Pool } = require('pg');
const fs = require('fs-extra');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const tableRes = await pool.query(`SELECT relname FROM pg_stat_user_tables`);
        const tables = tableRes.rows.map(r => r.relname);
        
        const backup = {};
        for (const table of tables) {
            try {
                const dataRes = await pool.query(`SELECT * FROM "${table}"`);
                backup[table] = dataRes.rows;
                console.log(`Respaldada tabla: ${table} (${dataRes.rows.length} registros)`);
            } catch (err) {
                console.log(`Omitiendo ${table}: ${err.message}`);
            }
        }
        
        fs.writeFileSync('public/backup_seguridad.json', JSON.stringify(backup, null, 2));
        console.log('\nBackup completo guardado en public/backup_seguridad.json');
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
