const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function compareDatabases() {
    console.log("==========================================");
    console.log("   COMPROBACIÓN: SQLITE vs SUPABASE (PG)  ");
    console.log("==========================================");

    // 1. Conectar a SQLite
    const sqlitePath = path.join(process.cwd(), 'ssoma.db');
    console.log(`💾 SQLite Path: ${sqlitePath}`);
    let sqlite;
    try {
        sqlite = new Database(sqlitePath, { readonly: true });
        console.log("✅ SQLite conectado.");
    } catch (e) {
        console.error("❌ Error al conectar a SQLite:", e.message);
        return;
    }

    // 2. Conectar a Supabase
    const pgUrl = process.env.POSTGRES_URL;
    if (!pgUrl) {
        console.error("❌ Error: POSTGRES_URL no definida en .env.local");
        sqlite.close();
        return;
    }
    const pool = new Pool({
        connectionString: pgUrl,
        ssl: { rejectUnauthorized: false }
    });
    let pgClient;
    try {
        pgClient = await pool.connect();
        console.log("✅ Supabase PG conectado.");
    } catch (e) {
        console.error("❌ Error al conectar a Supabase:", e.message);
        sqlite.close();
        return;
    }

    try {
        // Obtener todas las tablas de SQLite
        const sqliteTablesRes = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        const sqliteTables = sqliteTablesRes.map(t => t.name);
        
        // Obtener todas las tablas de Supabase
        const pgTablesRes = await pgClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const pgTables = pgTablesRes.rows.map(r => r.table_name);

        console.log("\n📋 Comparación de tablas y conteos:");
        console.log(
            String("Tabla").padEnd(30) + 
            String("SQLite").padStart(12) + 
            String("Supabase").padStart(12) + 
            String("Estado").padStart(15)
        );
        console.log("-".repeat(70));

        // Union de tablas para comparar
        const allTableNames = Array.from(new Set([...sqliteTables, ...pgTables])).sort();

        for (const tableName of allTableNames) {
            let sqliteCount = "N/A (No existe)";
            let pgCount = "N/A (No existe)";
            let status = "OK";

            const hasSqlite = sqliteTables.includes(tableName);
            const hasPg = pgTables.includes(tableName);

            if (hasSqlite) {
                try {
                    const row = sqlite.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
                    sqliteCount = row.count.toString();
                } catch (e) {
                    sqliteCount = "ERROR";
                }
            }

            if (hasPg) {
                try {
                    const res = await pgClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                    pgCount = res.rows[0].count.toString();
                } catch (e) {
                    pgCount = "ERROR";
                }
            }

            if (sqliteCount !== pgCount) {
                if (sqliteCount === "N/A (No existe)" || pgCount === "N/A (No existe)") {
                    status = "⚠️ Faltante";
                } else if (sqliteCount === "ERROR" || pgCount === "ERROR") {
                    status = "❌ Error";
                } else {
                    status = "⚠️ Diferente";
                }
            }

            console.log(
                tableName.padEnd(30) + 
                sqliteCount.padStart(12) + 
                pgCount.padStart(12) + 
                status.padStart(15)
            );
        }

    } catch (e) {
        console.error("❌ Error durante la comparación:", e);
    } finally {
        sqlite.close();
        pgClient.release();
        await pool.end();
        console.log("\n👋 Comparación finalizada.");
    }
}

compareDatabases();
