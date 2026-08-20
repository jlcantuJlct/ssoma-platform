const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("PRAGMA table_info(monthly_stats_records);", (err, rows) => {
    console.log("monthly_stats_records schema:", JSON.stringify(rows, null, 2));
  });
});
db.close();
