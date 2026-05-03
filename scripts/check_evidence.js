const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

console.log("--- HHC RECORDS ---");
const hhc = db.prepare("SELECT id, date, tema, responsable, evidence_imgs, evidence_pdf FROM hhc_records WHERE responsable LIKE '%Jesus%' OR responsable LIKE '%Galliquio%'").all();
console.log(JSON.stringify(hhc, null, 2));

console.log("\n--- PETAR RECORDS ---");
const petar = db.prepare("SELECT id, date, type, responsible, file_url FROM petar_records WHERE responsible LIKE '%Jesus%' OR responsible LIKE '%Galliquio%'").all();
console.log(JSON.stringify(petar, null, 2));

console.log("\n--- EVIDENCE CENTER RECORDS ---");
const ev = db.prepare("SELECT id, date, activity, description, responsable, file_url FROM evidence_center_records WHERE responsable LIKE '%Jesus%' OR responsable LIKE '%Galliquio%'").all();
console.log(JSON.stringify(ev, null, 2));
