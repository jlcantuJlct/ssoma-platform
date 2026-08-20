const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT month, year FROM monthly_program GROUP BY month, year;", (err, rows) => {
    console.log("monthly_program months:", JSON.stringify(rows));
  });

  db.all("SELECT * FROM brigadista_records LIMIT 5;", (err, rows) => {
    console.log("brigadista_records:", JSON.stringify(rows, null, 2));
  });

  db.all("SELECT * FROM simulacro_records LIMIT 5;", (err, rows) => {
    console.log("simulacro_records:", JSON.stringify(rows, null, 2));
  });

});
db.close();
