const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath, { readonly: true });

try {
    console.log("=== OBJECTIVES IN SQLITE ===");
    const objectives = db.prepare("SELECT * FROM objectives").all();
    console.log(JSON.stringify(objectives, null, 2));

    console.log("\n=== MONTHLY PROGRAM IN SQLITE (LIMIT 5) ===");
    const monthlyProgram = db.prepare("SELECT * FROM monthly_program LIMIT 5").all();
    console.log(JSON.stringify(monthlyProgram, null, 2));
} catch (e) {
    console.error("Error reading tables:", e.message);
} finally {
    db.close();
}
