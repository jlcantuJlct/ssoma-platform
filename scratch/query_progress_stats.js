const sqlite3 = require('better-sqlite3');
const db = sqlite3('ssoma.db');

try {
    const stats = db.prepare(`
        SELECT 
            SUM(CAST(plan_value AS REAL)) as programadas,
            SUM(CAST(executed_value AS REAL)) as ejecutadas
        FROM progress 
        WHERE month IN ('0', '1', '2', '0.0', '1.0', '2.0')
    `).get();

    console.log(stats);

    const monthCheck = db.prepare(`SELECT DISTINCT month FROM progress`).all();
    console.log('Months:', monthCheck.map(r => r.month));
} catch(e) {
    console.error(e);
}
