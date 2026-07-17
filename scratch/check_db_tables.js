const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);

for (const table of tables) {
    const count = db.prepare(`SELECT count(*) as c FROM ${table.name}`).get();
    console.log(`Table: ${table.name}, Rows: ${count.c}`);
}
