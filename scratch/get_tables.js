const Database = require('better-sqlite3');
const db = new Database('ssoma.db');
const get_schema = (table) => {
  console.log('--- ' + table + ' ---');
  console.log(db.prepare(`PRAGMA table_info(${table})`).all());
}
get_schema('training_program');
get_schema('activities');
get_schema('monthly_program_records');
get_schema('monthly_stats_records');
