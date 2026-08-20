
import 'dotenv/config.js';
import fs from 'fs';
import db from './lib/db.js';

const rescue = JSON.parse(fs.readFileSync('chinchaysullo_rescue.json'));
const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';

async function main() {
  try {
    const res = await db.fetchOne('SELECT fields FROM report_drafts WHERE doc_type = ?', [docType]);
    let current = {};
    if(res && res.fields) {
      current = typeof res.fields === 'string' ? JSON.parse(res.fields) : res.fields;
    }
    for(const k in rescue) {
      current[k] = rescue[k];
    }
    await db.execute('UPDATE report_drafts SET fields = ?, updated_at = CURRENT_TIMESTAMP WHERE doc_type = ?', [JSON.stringify(current), docType]);
    console.log('Successfully restored', Object.keys(rescue).length, 'photos into Chinchaysullo draft!');
  } catch(e) {
    console.error(e);
  }
}
main();
