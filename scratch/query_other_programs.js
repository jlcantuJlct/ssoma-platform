const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT * FROM monthly_program LIMIT 5;", (err, rows) => {
    if (err) console.error(err);
    else console.log("monthly_program:\n", JSON.stringify(rows, null, 2));
  });

  db.all("SELECT * FROM annual_program LIMIT 5;", (err, rows) => {
    if (err) console.error(err);
    else console.log("annual_program:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
