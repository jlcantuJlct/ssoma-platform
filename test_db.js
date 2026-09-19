const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM templates_config WHERE module_name ILIKE '%campamento%' ORDER BY id DESC LIMIT 1");
    console.log("items_json length:", JSON.parse(res.rows[0].items_json).length);
    console.log("items:", JSON.parse(res.rows[0].items_json).map(i => i.text));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
