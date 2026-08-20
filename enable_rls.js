require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function enableRLS() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    for (let row of res.rows) {
      const table = row.tablename;
      console.log(`Enabling RLS on ${table}...`);
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
    }
    console.log('Successfully enabled RLS on all public tables.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

enableRLS();
