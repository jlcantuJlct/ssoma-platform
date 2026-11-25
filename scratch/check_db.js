const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'
});

async function main() {
  console.log('--- Checking annual_programs ---');
  const res = await pool.query('SELECT workspace, data FROM annual_programs');
  for (const r of res.rows) {
    console.log('Workspace:', r.workspace);
    const keys = Object.keys(r.data || {});
    console.log('  Keys in data:', keys);
    if (r.data.obj1) console.log('  obj1 count:', r.data.obj1.length, r.data.obj1.map(x => x.descripcion || x.actividad));
    if (r.data.obj2) console.log('  obj2 count:', r.data.obj2.length, r.data.obj2.map(x => x.descripcion || x.actividad));
  }

  console.log('\n--- Checking training_subprograms ---');
  const subRes = await pool.query('SELECT workspace, data FROM training_subprograms');
  for (const r of subRes.rows) {
    console.log('Workspace:', r.workspace);
    const keys = Object.keys(r.data || {});
    console.log('  Keys:', keys);
    if (r.data.subprog_general) {
      console.log('  subprog_general items count:', r.data.subprog_general.items?.length);
    }
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
