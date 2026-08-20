const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT objective_id, data_json FROM annual_program;", (err, rows) => {
    let julyActivities = [];
    rows.forEach(r => {
      try {
        let arr = JSON.parse(r.data_json);
        arr.forEach(item => {
          if (item.date && item.date.includes('-07-')) {
            julyActivities.push({ ...item, objective_id: r.objective_id });
          }
        });
      } catch(e) {}
    });
    console.log("July Activities:", JSON.stringify(julyActivities, null, 2));
  });
});
db.close();
