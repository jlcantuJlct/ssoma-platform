const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    // Eliminar los duplicados que inserté yo (IDs 35-64)
    const del = await pool.query('DELETE FROM pesaje_records WHERE id >= 35 RETURNING id');
    console.log(`🗑️  Eliminados ${del.rows.length} registros duplicados (IDs 35-64)`);

    // Verificar lo que queda
    const remaining = await pool.query('SELECT COUNT(*) as cnt FROM pesaje_records');
    console.log(`✅ Registros restantes en BD: ${remaining.rows[0].cnt}`);

    const all = await pool.query('SELECT id, date, waste_type, weight FROM pesaje_records ORDER BY date, waste_type');
    all.rows.forEach(r => console.log(`  [${r.id}] ${r.date} | ${r.waste_type} | ${r.weight}`));

    await pool.end();
}
main().catch(console.error);
