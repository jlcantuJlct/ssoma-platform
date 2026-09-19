const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function run() {
  const res = await pool.query("SELECT id, items_json FROM templates_config WHERE module_name ILIKE '%campamento%' ORDER BY version DESC LIMIT 1");
  let items = JSON.parse(res.rows[0].items_json);
  let changed = false;
  items = items.map(i => {
    if (i.text === 'Tránsito peatonal') {
        i.type = 'title';
        changed = true;
    }
    return i;
  });
  
  if (changed) {
    await pool.query("UPDATE templates_config SET items_json = $1 WHERE id = $2", [JSON.stringify(items), res.rows[0].id]);
    console.log("DB patched: Tránsito peatonal is now a title!");
  } else {
    console.log("No changes needed.");
  }
  pool.end();
}
run();
