const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

const archives = db.prepare('SELECT id, doc_type, month_name FROM report_archives').all();
console.log("Archived Records:");
console.log(archives);
