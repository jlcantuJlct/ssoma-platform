const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

function cleanTable(tableName, uniqueFields) {
    console.log(`--- Cleaning ${tableName} ---`);
    const fieldsStr = uniqueFields.join(', ');
    const rows = db.prepare(`SELECT *, rowid FROM ${tableName}`).all();
    
    const seen = new Set();
    const toDelete = [];
    let nullIdsFixed = 0;

    for (const r of rows) {
        // Fix NULL IDs if any (though for SQLite rowid is better, but app uses 'id' column)
        if (r.id === null) {
            const newId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000000);
            db.prepare(`UPDATE ${tableName} SET id = ? WHERE rowid = ?`).run(newId, r.rowid);
            nullIdsFixed++;
        }

        const key = uniqueFields.map(f => String(r[f] || '').trim()).join('|');
        if (seen.has(key)) {
            toDelete.push(r.rowid);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        const deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE rowid = ?`);
        const transaction = db.transaction((ids) => {
            for (const id of ids) deleteStmt.run(id);
        });
        transaction(toDelete);
    }

    console.log(`Fixed ${nullIdsFixed} NULL IDs.`);
    console.log(`Deleted ${toDelete.length} duplicates.`);
}

cleanTable('hhc_records', ['date', 'tema', 'responsable', 'evidence_pdf']);
cleanTable('petar_records', ['date', 'type', 'responsible', 'file_url']);
cleanTable('ats_records', ['date', 'responsible', 'location', 'file_url']);
cleanTable('evidence_center_records', ['date', 'responsable', 'objective', 'activity', 'file_url']);
