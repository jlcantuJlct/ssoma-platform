const db = require('../lib/db');

async function check() {
    try {
        const count = await db.fetchAll('SELECT count(*) as c FROM pma_evidence_records');
        console.log('Total records:', count[0].c);
        
        const samples = await db.fetchAll('SELECT * FROM pma_evidence_records LIMIT 5');
        console.log('Sample records:', JSON.stringify(samples, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
