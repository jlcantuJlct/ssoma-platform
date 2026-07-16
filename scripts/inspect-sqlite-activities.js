const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath, { readonly: true });

try {
    console.log("=== SQLITE DISTINCT OBJECTIVE_IDS IN ACTIVITIES ===");
    const res = db.prepare("SELECT DISTINCT objective_id FROM activities").all();
    console.log(res);

    console.log("\n=== SQLITE OBJECTIVES ===");
    const obs = db.prepare("SELECT id, name, category, year FROM objectives").all();
    console.log(obs);
} catch (e) {
    console.error(e.message);
} finally {
    db.close();
}
