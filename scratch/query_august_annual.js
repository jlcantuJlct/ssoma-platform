const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT id, objective_id, data_json FROM annual_program;", (err, rows) => {
    if (err) console.error(err);
    else {
      let augustActivities = [];
      rows.forEach(row => {
        try {
          const data = JSON.parse(row.data_json);
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.date && (item.date.includes('-08-') || item.date.startsWith('2026-08'))) {
                augustActivities.push({ ...item, objective_id: row.objective_id });
              }
            });
          }
        } catch (e) {}
      });
      console.log("annual_program August Activities:\n", JSON.stringify(augustActivities, null, 2));
    }
  });
});
db.close();
