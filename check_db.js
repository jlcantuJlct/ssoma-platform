const sqlite3 = require('better-sqlite3');
const db = new sqlite3('app.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

const row = db.prepare("SELECT * FROM inspection_modules WHERE name LIKE '%Taller%'").get();
if (row) {
    console.log(row.template);
}
