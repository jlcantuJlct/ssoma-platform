require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});
const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
pool.query('SELECT fields, updated_at FROM report_drafts WHERE doc_type = $1', [docType]).then(res => {
  const fields = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
  console.log('Updated at:', res.rows[0].updated_at);
  console.log('Sample photo:', fields['foto_001']);
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
