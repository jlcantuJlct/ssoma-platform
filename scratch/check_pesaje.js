const Database = require('better-sqlite3');
const db = new Database('ssoma.db');

// Listar todas las tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('TABLAS EN DB LOCAL:', tables.map(t => t.name).join(', '));

// Intentar leer pesaje_records
try {
    const rows = db.prepare('SELECT COUNT(*) as cnt FROM pesaje_records').all();
    console.log('TOTAL REGISTROS pesaje_records:', rows[0].cnt);
    const sample = db.prepare('SELECT * FROM pesaje_records LIMIT 5').all();
    console.log('MUESTRA:', JSON.stringify(sample, null, 2));
} catch(e) {
    console.log('pesaje_records NO EXISTE en local:', e.message);
}
