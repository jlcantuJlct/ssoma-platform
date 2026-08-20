require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
    const dbRes = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
    if (dbRes.rows.length > 0) {
      const fields = typeof dbRes.rows[0].fields === 'string' ? JSON.parse(dbRes.rows[0].fields) : dbRes.rows[0].fields;
      console.log('Total fields in DB:', Object.keys(fields).length);
      console.log('Sample fields:', Object.keys(fields).slice(0, 10));
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
