const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM templates_config WHERE module_name ILIKE '%campamento%'");
    console.log("templates_config:", JSON.stringify(res.rows, null, 2));
    
    const res2 = await pool.query("SELECT * FROM inspection_modules WHERE name ILIKE '%campamento%'");
    console.log("inspection_modules:", JSON.stringify(res2.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
