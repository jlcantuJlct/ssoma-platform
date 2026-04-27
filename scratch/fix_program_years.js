const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

async function fixYears() {
    try {
        const records = db.prepare('SELECT * FROM annual_program').all();
        console.log(`Found ${records.length} objectives to update.`);
        
        for (const r of records) {
            let data = JSON.parse(r.data_json);
            let updated = false;
            data.forEach(item => {
                if (item.date && item.date.includes('2025-')) {
                    item.date = item.date.replace('2025-', '2026-');
                    updated = true;
                }
            });
            
            if (updated) {
                db.prepare('UPDATE annual_program SET data_json = ? WHERE id = ?').run(JSON.stringify(data), r.id);
                console.log(`Updated objective ${r.objective_id}`);
            }
        }
        console.log('Done fixing years.');
    } catch (e) {
        console.error(e);
    }
}

fixYears();
