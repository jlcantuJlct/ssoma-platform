const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
async function run() {
    const res = await pool.query('SELECT module_name, template_json, answers_json FROM hallazgo_levantamientos ORDER BY created_at DESC LIMIT 1');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
run();
