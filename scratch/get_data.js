const Database = require('better-sqlite3');
const db = new Database('ssoma.db');
const get_schema = (table) => {
  console.log('--- ' + table + ' ---');
  console.log(db.prepare(`PRAGMA table_info(${table})`).all());
}
get_schema('hhc_records');

const data = db.prepare("SELECT * FROM hhc_records LIMIT 5").all();
console.log('--- hhc_records ---');
console.log(data);
