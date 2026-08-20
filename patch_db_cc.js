require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First, set everyone to false
    await client.query('UPDATE notification_contacts SET is_permanent_cc = false WHERE is_permanent_cc = true');

    // Then, set only the 4 specified emails to true
    const emails = [
      'jcancino@casacontratistas.com',
      'jparodi@casacontratistas.com',
      'rguerra@casacontratistas.com',
      'adrian142005@hotmail.com'
    ];

    for (const email of emails) {
        await client.query(
          "UPDATE notification_contacts SET is_permanent_cc = true WHERE email = $1 AND area IS NULL", 
          [email]
        );
        // If there's no area IS NULL record for them, try to update any record or insert one if missing.
        // Wait, some of them have an area assigned, but the permanent CC record used to have area = NULL or their respective area.
        // Let's just update all records for those emails that already exist and have area IS NULL, or if they don't, set it for all.
        // Actually, earlier we had records for them with area IS NULL.
        await client.query(
          "UPDATE notification_contacts SET is_permanent_cc = true WHERE email = $1", 
          [email]
        );
    }

    await client.query('COMMIT');
    console.log("Database updated successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
