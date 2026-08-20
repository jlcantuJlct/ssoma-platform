require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});
const fs = require('fs');
const blobs = JSON.parse(fs.readFileSync('recent_blobs2.json'));

pool.query("SELECT fields FROM report_drafts WHERE doc_type = 'PAD_SAN_CLEMENTE_INTERNAL.docx'").then(res => {
  const scFields = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
  const scUrls = new Set(Object.values(scFields));
  
  const nonScBlobs = blobs.filter(b => !scUrls.has(b.url));
  const groups = {};
  
  nonScBlobs.forEach(b => {
    if(b.pathname.startsWith('foto_')) {
      const d = b.uploadedAt.substring(0,10);
      groups[d] = (groups[d]||0)+1;
    }
  });
  
  console.log('Non-SC blobs by date:');
  console.table(groups);
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
