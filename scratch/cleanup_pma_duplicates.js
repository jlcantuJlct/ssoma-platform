const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'ssoma.db');
const db = new Database(dbPath);

console.log('--- Cleaning PMA Duplicates ---');

// Find duplicates (same date, responsible, category, location, and images string)
const duplicates = db.prepare(`
    SELECT date, responsible, category, location, images, COUNT(*) as count
    FROM pma_evidence_records
    GROUP BY date, responsible, category, location, images
    HAVING count > 1
`).all();

console.log(`Found ${duplicates.length} duplicate groups.`);

let deletedTotal = 0;

duplicates.forEach(dup => {
    // For each group, keep the one with the highest ID (most recent)
    const allInstances = db.prepare(`
        SELECT id FROM pma_evidence_records
        WHERE date = ? AND responsible = ? AND category = ? AND location = ? AND images = ?
        ORDER BY id DESC
    `).all(dup.date, dup.responsible, dup.category, dup.location, dup.images);

    const idsToDelete = allInstances.slice(1).map(i => i.id);
    
    if (idsToDelete.length > 0) {
        const deleteStmt = db.prepare(`DELETE FROM pma_evidence_records WHERE id IN (${idsToDelete.join(',')})`);
        const info = deleteStmt.run();
        deletedTotal += info.changes;
        console.log(`- Group [${dup.date} | ${dup.responsible}]: Deleted ${info.changes} duplicates.`);
    }
});

console.log(`\nCleanup complete. Total records deleted: ${deletedTotal}`);
