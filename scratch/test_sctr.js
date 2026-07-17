const db = require('better-sqlite3')('ssoma.db');
const sctr = db.prepare('SELECT id, month, year, created_at FROM sctr_monthly_records').all();
console.log(sctr);
