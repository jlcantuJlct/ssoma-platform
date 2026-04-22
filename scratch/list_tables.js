const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

console.log("Tablas en ssoma.db:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));

db.close();
