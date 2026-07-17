const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

for (const table of tables) {
    try {
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        const dateCols = columns.filter(c => c.name.toLowerCase().includes('date') || c.type.toLowerCase().includes('date') || c.type.toLowerCase().includes('text'));
        
        for (const col of dateCols) {
            const query = `SELECT * FROM ${table.name} WHERE ${col.name} LIKE '%2026-05-20%'`;
            const results = db.prepare(query).all();
            if (results.length > 0) {
                console.log(`Table: ${table.name}, Column: ${col.name}, Matches: ${results.length}`);
                console.log(JSON.stringify(results.slice(0, 3), null, 2));
            }
        }
    } catch (e) {
        // console.error(e);
    }
}
