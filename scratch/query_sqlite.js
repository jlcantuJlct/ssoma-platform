const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity', 'ssoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.all("SELECT SUBSTRING(date, 1, 7) as month, count(*) FROM desvio_evidence_records GROUP BY month", [], (err, rows) => {
  if (err) {
    console.error("Error query desvio:", err.message);
  } else {
    console.log("Counts from desvio_evidence_records:");
    console.log(rows);
  }
  
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err2, tables) => {
      console.log("Tables in backup:", tables.map(t=>t.name).filter(n=>n.includes('desvio')));
      db.close();
  });
});
