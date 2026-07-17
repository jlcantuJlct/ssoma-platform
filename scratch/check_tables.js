const db = require('better-sqlite3')('ssoma.db');
const tables = ['annual_program', 'monthly_program', 'activities', 'monthly_program_records'];
for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} LIMIT 2`).all();
    console.log(`--- ${table} ---`);
    console.log(rows);
  } catch(e) {}
}
