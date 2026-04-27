const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

console.log('Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

for (const table of tables) {
    console.log(`\nSchema for ${table.name}:`);
    console.log(db.prepare(`PRAGMA table_info(${table.name})`).all());
    console.log(`\nData for ${table.name} (last 5):`);
    try {
        console.log(db.prepare(`SELECT * FROM ${table.name} ORDER BY id DESC LIMIT 5`).all());
    } catch (e) {
        console.log(db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all());
    }
}
