const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
    console.log("==========================================");
    console.log("   PRUEBA DE CONEXIÓN A SUPABASE (PG)     ");
    console.log("==========================================");
    
    const connectionString = process.env.POSTGRES_URL;
    console.log("URL:", connectionString ? "Definida (Ocultada por seguridad)" : "NO DEFINIDA");

    if (!connectionString) {
        console.error("❌ Error: No se encontró POSTGRES_URL en .env.local");
        return;
    }

    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("📡 Conectando a Supabase...");
        const client = await pool.connect();
        console.log("✅ ¡Conexión exitosa!");

        // 1. Obtener hora del servidor
        const timeRes = await client.query('SELECT NOW()');
        console.log("🕒 Hora del servidor DB:", timeRes.rows[0].now);

        // 2. Listar todas las tablas en la base de datos
        console.log("\n🧐 Consultando tablas existentes en el esquema public...");
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const existingTables = tablesRes.rows.map(r => r.table_name);
        console.log("📋 Tablas encontradas:", existingTables.join(', ') || "(ninguna)");

        // 3. Revisar cada tabla esperada y contar registros
        const expectedTables = [
            'objectives',
            'activities',
            'progress',
            'evidence',
            'monthly_program',
            'inspection_records',
            'export_requests',
            'hhc_records',
            'training_program',
            'annual_program',
            'inspections_records'
        ];

        console.log("\n📊 Conteos de registros por tabla:");
        for (const table of expectedTables) {
            if (existingTables.includes(table)) {
                try {
                    const countRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
                    console.log(`   - ${table}: ${countRes.rows[0].count} registros`);
                } catch (e) {
                    console.error(`   - ${table}: ❌ Error al contar:`, e.message);
                }
            } else {
                console.warn(`   - ${table}: ⚠️ NO EXISTE en la base de datos`);
            }
        }

        client.release();
        await pool.end();
        console.log("\n👋 Prueba finalizada correctamente.");

    } catch (error) {
        console.error("\n❌ ERROR DE CONEXIÓN O EJECUCIÓN:");
        console.error(error);
    }
}

testSupabase();
