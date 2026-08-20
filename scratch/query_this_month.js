const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  // Check any monthly_program_records that might be relevant
  db.all("SELECT * FROM monthly_program_records ORDER BY id DESC LIMIT 20;", (err, rows) => {
    console.log("monthly_program_records:\n", JSON.stringify(rows, null, 2));
  });

  // Check training_program for July and August
  db.all("SELECT * FROM training_program WHERE date LIKE '%2026-07%' OR date LIKE '%2026-08%' ORDER BY date ASC;", (err, rows) => {
    console.log("training_program Jul/Aug:\n", JSON.stringify(rows, null, 2));
  });

  // Check annual_program for 2026 July/August
  db.all("SELECT data_json FROM annual_program;", (err, rows) => {
    if(err) return;
    let results = [];
    rows.forEach(r => {
      try {
        let arr = JSON.parse(r.data_json);
        arr.forEach(item => {
          if(item.date && (item.date.includes('2026-07') || item.date.includes('2026-08') || item.date.includes('-07-') || item.date.includes('-08-'))) {
            results.push(item);
          }
        })
      }catch(e){}
    });
    console.log("annual_program Jul/Aug:\n", JSON.stringify(results.slice(0, 20), null, 2));
  });
});
db.close();
