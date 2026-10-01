const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
async function run() {
    const res = await pool.query('SELECT module_name, template_json, answers_json FROM hallazgo_levantamientos ORDER BY created_at DESC LIMIT 1');
    const row = res.rows[0];
    require('fs').writeFileSync('db_out.txt', JSON.stringify(row, null, 2));
    process.exit(0);
}
run();
