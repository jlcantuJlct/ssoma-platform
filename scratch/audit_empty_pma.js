const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

try {
    const rows = db.prepare(`
        SELECT id, date, responsible, category, images 
        FROM pma_evidence_records 
        WHERE (images IS NULL OR images = '' OR images = '[]')
        ORDER BY date DESC
    `).all();
    
    console.log(`🔎 Se encontraron ${rows.length} registros sin imágenes en PMA.`);
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.error("Error consultando la DB:", e);
}
