const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

try {
    const rows = db.prepare(`
        SELECT * FROM audit_logs 
        WHERE (details LIKE '%PMA%' OR action LIKE '%PMA%') 
        AND timestamp LIKE '2026-04%' 
        ORDER BY timestamp DESC
    `).all();
    
    console.log(`🔎 Se encontraron ${rows.length} registros en el historial de auditoría.`);
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.error("Error consultando audit_logs:", e);
}
