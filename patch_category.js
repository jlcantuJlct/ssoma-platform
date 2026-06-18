const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
        }
    });
}

let client;
if (process.env.POSTGRES_URL) {
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
        ssl: { rejectUnauthorized: false }
    });
    client = {
        execute: async (sql) => pool.query(sql)
    };
    console.log("Using Postgres");
} else {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'ssoma.db');
    const sqlite = new Database(dbPath);
    client = {
        execute: async (sql) => sqlite.exec(sql)
    };
    console.log("Using local SQLite");
}

async function run() {
    try {
        console.log("Adding category column...");
        await client.execute("ALTER TABLE virtual_trainings ADD COLUMN category TEXT DEFAULT 'Todos'");
        console.log("Column added successfully.");
    } catch (e) {
        if (e.message.includes("duplicate column") || e.message.includes("already exists")) {
            console.log("Column already exists. Skipping.");
        } else {
            console.error("Error adding column:", e.message);
        }
    }
    process.exit(0);
}

run();
