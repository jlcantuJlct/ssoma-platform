const db = require('better-sqlite3')('ssoma.db');
const records = db.prepare("SELECT * FROM sctr_monthly_records WHERE month = 'Julio'").all();
console.log(JSON.stringify(records.map(r => ({ ...r, personnel_list: r.personnel_list?.substring(0, 500) + '...' })), null, 2));
