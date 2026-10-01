const Database = require('better-sqlite3');
const db = new Database('./.data/ssoma.db');
try {
    db.exec("ALTER TABLE inspection_records ADD COLUMN updated_at BIGINT");
    console.log("Added updated_at column");
} catch(e) {
    console.log("Column likely exists:", e.message);
}
db.exec("UPDATE inspection_records SET updated_at = id WHERE updated_at IS NULL");
db.close();
