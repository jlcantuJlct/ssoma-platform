const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const res = await pool.query("SELECT * FROM evidence_center_records WHERE objective = 'OBJ 01' ORDER BY created_at DESC LIMIT 50");
    const counts = {};
    res.rows.forEach(r => {
      counts[r.activity] = (counts[r.activity] || 0) + 1;
    });
    console.log("Activity Counts (last 50):", counts);
    
    // Search specifically for 'reunion' or 'ordinaria'
    const reunion = await pool.query("SELECT * FROM evidence_center_records WHERE activity ILIKE '%reunion%' OR activity ILIKE '%ordinaria%' ORDER BY created_at DESC LIMIT 5");
    console.log("Recent Reuniones:", reunion.rows.map(r => ({ id: r.id, act: r.activity, desc: r.description, date: r.date, created: r.created_at })));
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
