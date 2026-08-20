const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT * FROM activities WHERE area IN ('emergency', 'health', 'safety');", (err, rows) => {
    console.log("Activities for emergency/health/safety:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
