const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT area, name, frequency FROM activities ORDER BY area, frequency;", (err, rows) => {
    console.log("Activities:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
