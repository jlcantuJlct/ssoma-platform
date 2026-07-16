const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

const tables = [
    'evidence_center_records',
    'actas_supervision',
    'actas_levantamiento',
    'accidentes_records',
    'epp_records',
    'activities',
    'evidence'
];

for (const table of tables) {
    try {
        const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
        if (tableExists) {
            const columns = db.pragma(`table_info(${table})`);
            const hasCreatedAt = columns.some(c => c.name === 'created_at');
            
            if (!hasCreatedAt) {
                console.log(`Adding created_at to ${table}...`);
                db.prepare(`ALTER TABLE ${table} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).run();
                console.log(`Successfully added created_at to ${table}.`);
            } else {
                console.log(`Column created_at already exists in ${table}.`);
            }
        }
    } catch (e) {
        console.error(`Error migrating ${table}:`, e.message);
    }
}

console.log('Migration complete.');
db.close();
