const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT * FROM objectives;", (err, rows) => {
    if (err) console.error(err);
    else console.log("objectives:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
