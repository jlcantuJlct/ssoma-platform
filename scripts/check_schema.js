const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

const tables = ['hhc_records', 'petar_records', 'ats_records', 'evidence_center_records', 'inspections_records'];
for (const table of tables) {
    try {
        const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
        console.log(`--- ${table} ---`);
        console.log(schema ? schema.sql : 'Not found');
    } catch (e) {
        console.log(`Error reading ${table}: ${e.message}`);
    }
}
