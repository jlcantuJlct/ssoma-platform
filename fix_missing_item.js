const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function run() {
  const res = await pool.query("SELECT id, items_json FROM templates_config WHERE module_name ILIKE '%campamento%' ORDER BY version DESC LIMIT 1");
  let items = JSON.parse(res.rows[0].items_json);
  
  // Find "Superficies en buenas condiciones" which is the first item in Tránsito Peatonal
  const idx = items.findIndex(i => i.text === 'Superficies en buenas condiciones');
  
  if (idx !== -1) {
    // Insert "Vias peatonales señalizadas" right after it, but wait! The user might want a slightly different text to avoid duplicate matching?
    // In export-excel, my duplicate matcher fixes duplicate writes, so same text is fine!
    
    // Check if it's already there
    if (items[idx + 1].text !== 'Vias peatonales señalizadas') {
      items.splice(idx + 1, 0, { text: 'Vias peatonales señalizadas', type: 'question' });
      await pool.query("UPDATE templates_config SET items_json = $1 WHERE id = $2", [JSON.stringify(items), res.rows[0].id]);
      console.log("DB patched: Added missing duplicate item 'Vias peatonales señalizadas'!");
    } else {
      console.log("Already exists.");
    }
  }
  pool.end();
}
run();
