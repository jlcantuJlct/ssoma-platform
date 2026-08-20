require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    let data = fs.readFileSync('debug-program.json', 'utf16le');
    if(data.charCodeAt(0) === 0xFEFF) data = data.substring(1);
    const parsed = JSON.parse(data);
    const chinchaysullo = parsed.find(d => d.doc_type === 'PAD_CHINCHAYSULLO_INTERNAL.docx');
    
    if(!chinchaysullo) {
      console.error('Not found in debug-program.json');
      return;
    }
    
    const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
    const fieldsToRestore = chinchaysullo.fields;
    
    // Merge into current DB just to keep other non-photo fields intact if needed
    const res = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
    let current = {};
    if (res.rows.length > 0) {
      current = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
    }
    
    // Clear out existing photos to prevent mixing
    for (const k in current) {
      if(k.startsWith('foto_') || k.startsWith('_uploader')) {
        delete current[k];
      }
    }
    
    // Restore from debug backup
    for (const k in fieldsToRestore) {
      current[k] = fieldsToRestore[k];
    }
    
    const updateQuery = 'UPDATE report_drafts SET fields = $1, updated_at = CURRENT_TIMESTAMP WHERE doc_type = $2';
    await pool.query(updateQuery, [JSON.stringify(current), docType]);
    console.log('Successfully restored', Object.keys(fieldsToRestore).filter(k => k.startsWith('foto_')).length, 'photos from debug-program.json into Chinchaysullo draft!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
