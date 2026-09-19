const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT id, module_name, version, length(items_json) as len FROM templates_config WHERE module_name ILIKE '%campamento%' ORDER BY version DESC");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
