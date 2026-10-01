const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await pool.query(`UPDATE inspection_records SET updated_at = $1 WHERE id = 1790800267129`, [Date.now()]);
    console.log("Forced update to jump to top");
}
main();
