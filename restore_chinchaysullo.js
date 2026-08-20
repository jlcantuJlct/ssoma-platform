require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});
const fs = require('fs');
const rescue = JSON.parse(fs.readFileSync('chinchaysullo_rescue.json'));
const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';

pool.query('SELECT fields FROM report_drafts WHERE doc_type = ', [docType])
  .then(res => {
    let current = {};
    if(res.rows.length > 0) {
      current = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
    }
    for(const k in rescue) {
      current[k] = rescue[k];
    }
    return pool.query('UPDATE report_drafts SET fields = , updated_at = CURRENT_TIMESTAMP WHERE doc_type = ', [JSON.stringify(current), docType]);
  })
  .then(() => {
    console.log('Successfully restored', Object.keys(rescue).length, 'photos into Chinchaysullo draft!');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
