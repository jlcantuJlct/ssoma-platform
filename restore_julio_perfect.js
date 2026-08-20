require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const rescue = JSON.parse(fs.readFileSync('chinchaysullo_julio_nearest.json'));
    const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
    
    const res = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
    let current = {};
    if (res.rows.length > 0) {
      current = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
    }
    
    // Wipe out the June photos from the draft
    for (const k in current) {
      if(k.startsWith('foto_') || k.startsWith('_uploader')) {
        delete current[k];
      }
    }
    
    // Set text to July
    current['mes_anio'] = 'Julio 2026';
    
    // Put the nearest matched photos
    for (const k in rescue) {
      current[k] = rescue[k];
    }
    
    const updateQuery = 'UPDATE report_drafts SET fields = $1, updated_at = CURRENT_TIMESTAMP WHERE doc_type = $2';
    await pool.query(updateQuery, [JSON.stringify(current), docType]);
    console.log(`Successfully restored ${Object.keys(rescue).length} photos for JULIO into Chinchaysullo draft!`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
