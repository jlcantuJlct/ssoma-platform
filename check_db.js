const db = require('./lib/db').default;

async function check() {
    try {
        const rows = await db.fetchAll('SELECT * FROM inspection_records WHERE date = ?', ['2026-03-03']);
        console.log('Results for 2026-03-03:');
        console.log(JSON.stringify(rows, null, 2));

        const all = await db.fetchAll('SELECT id, date, responsible, evidence_pdf FROM inspection_records ORDER BY id DESC LIMIT 5');
        console.log('\nLatest 5 records:');
        console.log(JSON.stringify(all, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
