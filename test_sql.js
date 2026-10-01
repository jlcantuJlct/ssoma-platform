const Database = require('better-sqlite3');
const db = new Database('./.data/ssoma.db');
try {
    const row = db.prepare('SELECT * FROM inspection_records ORDER BY COALESCE(updated_at, id) DESC LIMIT 1').get();
    console.log("Success!", row);
} catch(e) {
    console.error("SQL Error:", e.message);
}
db.close();
