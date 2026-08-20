require('dotenv').config({path: '.env.local'});
const { google } = require('googleapis');
const { Pool } = require('pg');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await drive.files.list({
      q: "name = 'Plantilla PAD CHINCHAYSULLO Julio 2026' and trashed=false",
      fields: 'files(id)'
    });
    const folderId = res.data.files[0].id;
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 1000
    });
    
    const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
    const dbRes = await pool.query('SELECT fields FROM report_drafts WHERE doc_type = $1', [docType]);
    if (dbRes.rows.length === 0) return console.log('Draft not found');
    
    const fields = typeof dbRes.rows[0].fields === 'string' ? JSON.parse(dbRes.rows[0].fields) : dbRes.rows[0].fields;
    
    let patched = 0;
    files.data.files.forEach(df => {
      const match = df.name.match(/foto_(\d+)/);
      if (match) {
        const key = 'foto_' + match[1];
        if (fields[key]) {
          fields[`_driveUrl_${key}`] = df.webViewLink;
          patched++;
        }
      }
    });
    
    await pool.query('UPDATE report_drafts SET fields = $1 WHERE doc_type = $2', [JSON.stringify(fields), docType]);
    console.log(`Patched ${patched} drive URLs!`);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
