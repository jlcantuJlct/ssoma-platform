require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs'").then(res => {
  console.table(res.rows);
  return pool.query("SELECT action, entity_type, entity_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5");
}).then(res2 => {
  console.table(res2.rows);
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
