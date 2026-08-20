const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT DISTINCT area FROM activities;", (err, rows) => {
    console.log("Distinct areas in activities:", JSON.stringify(rows));
  });

  db.all("SELECT * FROM activities WHERE name LIKE '%brigadis%';", (err, rows) => {
    console.log("Activities with brigadista:", JSON.stringify(rows, null, 2));
  });
});
db.close();
