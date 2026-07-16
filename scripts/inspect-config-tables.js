const fs = require('fs');
const path = require('path');
const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const sqliteDbPath = path.join(process.cwd(), 'ssoma.db');
const dbSqlite = new sqlite3(sqliteDbPath);

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    console.log("=== OBJECTIVES IN SQLITE ===");
    try {
        const sqliteObjs = dbSqlite.prepare("SELECT * FROM objectives").all();
        console.log(sqliteObjs);
    } catch (e) {
        console.error("Error reading objectives from SQLite:", e.message);
    }

    console.log("=== MONTHLY PROGRAM IN SQLITE (First 5 rows) ===");
    try {
        const sqliteProg = dbSqlite.prepare("SELECT * FROM monthly_program LIMIT 5").all();
        console.log(sqliteProg);
    } catch (e) {
        console.error("Error reading monthly_program from SQLite:", e.message);
    }

    console.log("=== TRAINING PROGRAM IN SQLITE (First 5 rows) ===");
    try {
        const sqliteTrain = dbSqlite.prepare("SELECT * FROM training_program LIMIT 5").all();
        console.log(sqliteTrain);
    } catch (e) {
        console.error("Error reading training_program from SQLite:", e.message);
    }

    console.log("\n=== OBJECTIVES IN SUPABASE ===");
    try {
        const pgRes = await pool.query("SELECT * FROM objectives");
        console.log(pgRes.rows);
    } catch (e) {
        console.error("Error reading objectives from PG:", e.message);
    }

    console.log("=== MONTHLY PROGRAM IN SUPABASE (First 5 rows) ===");
    try {
        const pgRes = await pool.query("SELECT * FROM monthly_program LIMIT 5");
        console.log(pgRes.rows);
    } catch (e) {
        console.error("Error reading monthly_program from PG:", e.message);
    }

    console.log("=== TRAINING PROGRAM IN SUPABASE (First 5 rows) ===");
    try {
        const pgRes = await pool.query("SELECT * FROM training_program LIMIT 5");
        console.log(pgRes.rows);
    } catch (e) {
        console.error("Error reading training_program from PG:", e.message);
    }

    await pool.end();
    dbSqlite.close();
}

inspect();
