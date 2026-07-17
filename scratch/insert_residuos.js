const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

const registros = [
    // ── RESIDUOS APROVECHABLES (No Peligrosos) ──────────────────────
    // RESIDUOS METALICOS
    { date: '2026-02-01', waste_type: 'RESIDUOS METALICOS',       weight: 20,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-04-01', waste_type: 'RESIDUOS METALICOS',       weight: 10,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-05-01', waste_type: 'RESIDUOS METALICOS',       weight: 15,   location: 'GENERAL', category: 'No Peligroso' },
    // PAPELES Y CARTONES
    { date: '2026-01-01', waste_type: 'PAPELES Y CARTONES',       weight: 1,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-02-01', waste_type: 'PAPELES Y CARTONES',       weight: 4,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-03-01', waste_type: 'PAPELES Y CARTONES',       weight: 10,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-04-01', waste_type: 'PAPELES Y CARTONES',       weight: 20,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-05-01', waste_type: 'PAPELES Y CARTONES',       weight: 12,   location: 'GENERAL', category: 'No Peligroso' },
    // PLASTICOS
    { date: '2026-01-01', waste_type: 'PLASTICOS',                weight: 1,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-02-01', waste_type: 'PLASTICOS',                weight: 1,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-03-01', waste_type: 'PLASTICOS',                weight: 10,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-04-01', waste_type: 'PLASTICOS',                weight: 1,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-05-01', waste_type: 'PLASTICOS',                weight: 1,    location: 'GENERAL', category: 'No Peligroso' },
    // RESIDUOS NO APROVECHABLE
    { date: '2026-01-01', waste_type: 'RESIDUOS NO APROVECHABLE', weight: 5,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-02-01', waste_type: 'RESIDUOS NO APROVECHABLE', weight: 4,    location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-03-01', waste_type: 'RESIDUOS NO APROVECHABLE', weight: 30,   location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-04-01', waste_type: 'RESIDUOS NO APROVECHABLE', weight: 200,  location: 'GENERAL', category: 'No Peligroso' },
    { date: '2026-05-01', waste_type: 'RESIDUOS NO APROVECHABLE', weight: 190,  location: 'GENERAL', category: 'No Peligroso' },

    // ── RESIDUOS PELIGROSOS ─────────────────────────────────────────
    // TRAPOS INDUSTRIALES
    { date: '2026-02-01', waste_type: 'TRAPOS INDUSTRIALES',      weight: 50,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-03-01', waste_type: 'TRAPOS INDUSTRIALES',      weight: 10,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-04-01', waste_type: 'TRAPOS INDUSTRIALES',      weight: 10,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-05-01', waste_type: 'TRAPOS INDUSTRIALES',      weight: 4.5,  location: 'GENERAL', category: 'Peligroso' },
    // RESIDUOS SOLIDOS (PEL)
    { date: '2026-02-01', waste_type: 'RESIDUOS SOLIDOS (PEL)',   weight: 15,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-03-01', waste_type: 'RESIDUOS SOLIDOS (PEL)',   weight: 30,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-04-01', waste_type: 'RESIDUOS SOLIDOS (PEL)',   weight: 25,   location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-05-01', waste_type: 'RESIDUOS SOLIDOS (PEL)',   weight: 10,   location: 'GENERAL', category: 'Peligroso' },
    // RESIDUOS LIQUIDOS
    { date: '2026-02-01', waste_type: 'RESIDUOS LIQUIDOS',        weight: 2,    location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-03-01', waste_type: 'RESIDUOS LIQUIDOS',        weight: 3,    location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-04-01', waste_type: 'RESIDUOS LIQUIDOS',        weight: 1,    location: 'GENERAL', category: 'Peligroso' },
    { date: '2026-05-01', waste_type: 'RESIDUOS LIQUIDOS',        weight: 2,    location: 'GENERAL', category: 'Peligroso' },
];

async function main() {
    console.log('🔌 Conectando a Supabase...');

    // Crear tabla si no existe
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pesaje_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            waste_type VARCHAR(100),
            weight REAL,
            location VARCHAR(200),
            category VARCHAR(50),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Tabla verificada');

    let ok = 0, fail = 0;
    for (const r of registros) {
        try {
            const res = await pool.query(
                `INSERT INTO pesaje_records (date, waste_type, weight, location, category, files)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [r.date, r.waste_type, r.weight, r.location, r.category, '[]']
            );
            console.log(`✅ [id:${res.rows[0].id}] ${r.waste_type} | ${r.date} | ${r.weight} kg`);
            ok++;
        } catch (e) {
            console.error(`❌ ${r.waste_type} ${r.date}: ${e.message}`);
            fail++;
        }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`TOTAL: ${ok} insertados ✅  |  ${fail} errores ❌`);
    console.log(`${'═'.repeat(50)}`);
    await pool.end();
}

main().catch(console.error);
