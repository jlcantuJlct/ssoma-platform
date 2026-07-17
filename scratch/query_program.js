const sqlite3 = require('better-sqlite3');
const db = sqlite3('ssoma.db');
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('--- SQLITE: activities ---');
    try {
        console.log(db.prepare("SELECT COUNT(*) FROM activities").get());
    } catch(e) {}

    console.log('--- SQLITE: progress ---');
    try {
        console.log(db.prepare("SELECT * FROM progress LIMIT 5").all());
        console.log("Progress summary:", db.prepare("SELECT month, status, count(*) FROM progress GROUP BY month, status").all());
    } catch(e) {}

    console.log('--- POSTGRES: activities ---');
    try {
        const res1 = await pool.query("SELECT COUNT(*) FROM activities");
        console.log(res1.rows);
    } catch(e) {}

    console.log('--- POSTGRES: progress ---');
    try {
        const res2 = await pool.query("SELECT month, status, count(*) FROM progress GROUP BY month, status");
        console.log(res2.rows);
    } catch(e) {}
    
    pool.end();
}
run();
