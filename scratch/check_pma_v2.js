const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

async function check() {
    try {
        const count = db.prepare('SELECT count(*) as c FROM pma_evidence_records').get();
        console.log('Total records:', count.c);
        
        const samples = db.prepare('SELECT * FROM pma_evidence_records LIMIT 20').all();
        console.log('Sample records:', JSON.stringify(samples, null, 2));
        
        // Check for exact duplicates
        const dups = db.prepare(`
            SELECT date, responsible, category, location, images, count(*) as cnt 
            FROM pma_evidence_records 
            GROUP BY date, responsible, category, location, images 
            HAVING cnt > 1
        `).all();
        console.log('Duplicates found:', dups.length);
        if (dups.length > 0) {
            console.log('Sample duplicates:', JSON.stringify(dups.slice(0, 5), null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

check();
