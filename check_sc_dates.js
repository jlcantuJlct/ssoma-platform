require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT fields FROM report_drafts WHERE doc_type = 'PAD_SAN_CLEMENTE_INTERNAL.docx'").then(res => {
  const fields = typeof res.rows[0].fields === 'string' ? JSON.parse(res.rows[0].fields) : res.rows[0].fields;
  const groups = {};
  for(const k in fields) {
    if(k.startsWith('foto_')) {
      const url = fields[k];
      const m = url.match(/foto_\d+_(1\d+)\./);
      if(m) {
        const d = new Date(parseInt(m[1])).toISOString().substring(0,10);
        groups[d] = (groups[d] || 0) + 1;
      }
    }
  }
  console.log('San Clemente draft blob dates:');
  console.table(groups);
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
