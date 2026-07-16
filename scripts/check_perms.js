require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const perms = await pool.query('SELECT * FROM template_permissions');
        console.log("Permissions:");
        console.table(perms.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

main();
