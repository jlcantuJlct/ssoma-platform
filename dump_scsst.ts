import db from './lib/db';
(async () => { 
  const rows = await db.fetchAll("SELECT * FROM evidence_center_records WHERE objective = 'OBJ 01'"); 
  console.log(JSON.stringify(rows.map(r => ({id: r.id, activity: r.activity, desc: r.description})), null, 2)); 
})();
