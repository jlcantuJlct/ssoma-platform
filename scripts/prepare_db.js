
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'ssoma.db');
console.log(`Openning database at ${dbPath}`);

try {
    const db = new Database(dbPath);
    console.log('Checkpointing WAL file...');
    db.pragma('wal_checkpoint(RESTART)');
    console.log('Database checkpointed successfully. ssoma.db is now up to date and safe to upload.');
    db.close();
} catch (error) {
    console.error('Error during checkpoint:', error);
}
