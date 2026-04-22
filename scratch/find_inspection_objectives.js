const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'ssoma.db');
const db = new Database(dbPath);

console.log("Buscando objetivos relacionados con inspecciones...");
const objectives = db.prepare("SELECT id, name FROM objectives").all();

const relevantObjectives = objectives.filter(obj => 
    /inspecci[oó]n/i.test(obj.name) || 
    /inspec/i.test(obj.name)
);

console.log("Objetivos encontrados:");
console.log(JSON.stringify(relevantObjectives, null, 2));

if (relevantObjectives.length > 0) {
    const ids = relevantObjectives.map(obj => `'${obj.id}'`).join(',');
    console.log(`\nActividades para los objetivos encontrados (${ids}):`);
    const activities = db.prepare(`SELECT name, objective_id FROM activities WHERE objective_id IN (${ids})`).all();
    console.log(JSON.stringify(activities, null, 2));
}

db.close();
