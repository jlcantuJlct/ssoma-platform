import path from 'path';

// Helper to convert SQLite query (?) to Postgres query ($1, $2)
function sqlToPostgres(sql: string): string {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
}

type QueryResult = {
    rows: any[];
    rowCount?: number;
};

// Interface mimicking better-sqlite3 but async
export interface DBClient {
    // Basic Query
    query(sql: string, params?: any[]): Promise<QueryResult>;

    // Helpers mirroring better-sqlite3 patterns
    execute(sql: string, params?: any[]): Promise<QueryResult>; // For INSERT/UPDATE/DELETE
    fetchOne(sql: string, params?: any[]): Promise<any>;        // For SELECT single row (get)
    fetchAll(sql: string, params?: any[]): Promise<any[]>;      // For SELECT multiple rows (all)

    // Transaction wrapper
    transaction(fn: () => Promise<void>): Promise<void>;
}

let client: DBClient;

if (process.env.POSTGRES_URL) {
    // --- VERCEL POSTGRES MODE ---
    const { createPool } = require('@vercel/postgres');

    const pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });

    client = {
        async query(text: string, params: any[] = []) {
            // Convert ? -> $1, $2
            const pgSql = sqlToPostgres(text);
            try {
                const res = await pool.query(pgSql, params);
                return { rows: res.rows, rowCount: res.rowCount || 0 };
            } catch (error) {
                console.error("SQL Error (Postgres):", error, "\nQuery:", pgSql);
                throw error;
            }
        },
        async execute(text, params = []) {
            const res = await this.query(text, params);
            return res;
        },
        async fetchOne(text, params = []) {
            const res = await this.query(text, params);
            return res.rows[0] || undefined;
        },
        async fetchAll(text, params = []) {
            const res = await this.query(text, params);
            return res.rows;
        },
        async transaction(fn) {
            // Simple sequential execution for now.
            // Full transaction support in serverless pools is complex without a dedicated client.
            await fn();
        }
    };
    console.log("🔌 Connect mode: Vercel Postgres");

} else {
    // --- LOCAL SQLITE MODE ---
    // Fallback for local dev if no Env vars
    const Database = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'ssoma.db');
    let sqlite: any;

    try {
        sqlite = new Database(dbPath/*, { verbose: console.log } */);
        sqlite.pragma('journal_mode = WAL');
        console.log("💾 Connect mode: Local SQLite");
    } catch (e) {
        console.warn("Could not open SQLite DB:", e);
        sqlite = {
            prepare: () => ({
                all: () => [],
                get: () => null,
                run: () => ({ changes: 0 })
            }),
            transaction: (fn: any) => fn
        };
    }

    client = {
        async query(text: string, params: any[] = []) {
            try {
                const stmt = sqlite.prepare(text);
                if (text.trim().toUpperCase().startsWith('SELECT')) {
                    const rows = stmt.all(...params);
                    return { rows, rowCount: rows.length };
                } else {
                    const info = stmt.run(...params);
                    return { rows: [], rowCount: info.changes };
                }
            } catch (error) {
                console.error("SQL Error (SQLite):", error);
                throw error;
            }
        },
        async execute(text, params = []) {
            const stmt = sqlite.prepare(text);
            const info = stmt.run(...params);
            return { rows: [], rowCount: info.changes };
        },
        async fetchOne(text, params = []) {
            const stmt = sqlite.prepare(text);
            return stmt.get(...params);
        },
        async fetchAll(text, params = []) {
            const stmt = sqlite.prepare(text);
            return stmt.all(...params);
        },
        async transaction(fn) {
            const tx = sqlite.transaction(async () => {
                await fn();
            });
            await tx();
        }
    };
}

export default client;
