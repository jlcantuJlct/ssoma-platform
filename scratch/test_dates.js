const db = require('better-sqlite3')('ssoma.db');

try {
    const sctr = db.prepare('SELECT * FROM sctr_monthly_records ORDER BY id DESC LIMIT 3').all();
    console.log("SCTR:", sctr);
    
    const hhc = db.prepare('SELECT date FROM hhc_records ORDER BY id DESC LIMIT 3').all();
    console.log("HHC:", hhc);

    const insp = db.prepare('SELECT date FROM inspection_records ORDER BY id DESC LIMIT 3').all();
    console.log("INSP:", insp);
} catch(e) {
    console.error(e);
}
