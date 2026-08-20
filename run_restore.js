require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});
const fs = require('fs');
const rescue = JSON.parse(fs.readFileSync('chinchaysullo_rescue.json'));
const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';

async function main() {
  try {
    const res = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
    let current = {};
    if (res.rows.length > 0) {
      current = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
    }
    for (const k in rescue) {
      current[k] = rescue[k];
    }
    const updateQuery = 'UPDATE report_drafts SET fields = $1, updated_at = CURRENT_TIMESTAMP WHERE doc_type = $2';
    await pool.query(updateQuery, [JSON.stringify(current), docType]);
    console.log('Successfully restored ' + Object.keys(rescue).length + ' photos into Chinchaysullo draft!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
