
const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function checkDb() {
    console.log("🔌 Probando conexión a Postgres...");
    console.log("URL:", process.env.POSTGRES_URL ? "Definida" : "NO DEFINIDA");

    if (!process.env.POSTGRES_URL) {
        console.error("❌ Falta POSTGRES_URL en .env.local");
        return;
    }

    const pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });

    try {
        const client = await pool.connect();
        console.log("✅ Conexión establecida.");

        const res = await client.query('SELECT NOW()');
        console.log("🕒 Hora del servidor DB:", res.rows[0]);

        await client.release();
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
}

checkDb();
