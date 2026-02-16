
require('dotenv').config({ path: '.env.local' });
const { createPool } = require('@vercel/postgres');
const path = require('path');

async function testDB() {
    console.log("🔍 Iniciando prueba de conexión...");
    console.log("-----------------------------------");

    if (!process.env.POSTGRES_URL) {
        console.error("❌ Error: No se encontró POSTGRES_URL en .env.local");
        return;
    } else {
        console.log("✅ Variable de entorno POSTGRES_URL detectada.");
    }

    try {
        console.log("📡 Creando cliente de base de datos...");
        const pool = createPool({
            connectionString: process.env.POSTGRES_URL,
        });

        console.log("� Conectando...");
        const client = await pool.connect();
        console.log("✅ ¡Conexión exitosa!");

        // Solo verificar tablas, sin insertar nada
        console.log("🧐 Consultando tablas existentes...");
        const resTable = await client.query(`
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_name = 'inspection_records';
        `);

        if (resTable.rowCount > 0) {
            console.log(`✅ Tabla 'inspection_records' encontrada (${resTable.rowCount} columnas detectadas).`);
        } else {
            console.warn("⚠️ La tabla 'inspection_records' NO parece existir o no es accesible.");
        }

        client.release();
        await pool.end();
        console.log("👋 Prueba finalizada correctamente.");

    } catch (error) {
        console.error("\n❌ ERROR GRAVE:");
        console.error(error);
    }
}

testDB();
