const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM inspection_records').then(res => {
  console.log('Count:', res.rows[0].count);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
