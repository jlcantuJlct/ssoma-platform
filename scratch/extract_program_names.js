const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

console.log("Extrayendo actividades de 'monthly_program'...");
const mRows = db.prepare("SELECT DISTINCT inspection_type, area FROM monthly_program").all();
console.log(JSON.stringify(mRows, null, 2));

console.log("\nExtrayendo de 'activities'...");
try {
    const rows = db.prepare("SELECT name, objective_id FROM activities WHERE objective_id IN ('obj3', 'obj6', 'obj8')").all();
    const results = {};
    rows.forEach(row => {
        if (!results[row.objective_id]) results[row.objective_id] = [];
        results[row.objective_id].push(row.name);
    });
    console.log(JSON.stringify(results, null, 2));
} catch (e) {
    console.error("Error query activities:", e.message);
}

db.close();
