require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
  
  const existing = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
  if (existing.rows.length === 0) return console.log('Draft not found');
  
  const currentFields = typeof existing.rows[0].fields === 'string' ? JSON.parse(existing.rows[0].fields) : existing.rows[0].fields;
  const newFields = { ...currentFields };
  
  let cleared = 0;
  for (const k of Object.keys(newFields)) {
      if (k.startsWith('_driveUrl_')) {
          delete newFields[k];
          cleared++;
      }
  }
  
  await pool.query('UPDATE report_drafts SET fields = $1 WHERE doc_type = $2', [JSON.stringify(newFields), docType]);
  
  console.log(`Cleared ${cleared} bad driveUrls from DB!`);
  pool.end();
}
main();
