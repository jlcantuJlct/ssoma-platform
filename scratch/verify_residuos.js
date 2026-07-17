const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const rows = await pool.query('SELECT id, date, waste_type, weight, category FROM pesaje_records ORDER BY id');
    console.log(`Total registros en Supabase: ${rows.rows.length}`);
    rows.rows.forEach(r => console.log(`  [${r.id}] ${r.date} | ${r.waste_type} | ${r.weight} | ${r.category}`));

    // Probar el GET igual que lo hace la API
    const api = await pool.query('SELECT * FROM pesaje_records ORDER BY date DESC, id DESC');
    console.log('\n✅ La API devolvería', api.rows.length, 'registros');
    await pool.end();
}
main().catch(console.error);
