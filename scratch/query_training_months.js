const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT substr(date, 1, 7) as month, count(*) as count FROM training_program GROUP BY month;", (err, rows) => {
    if (err) console.error(err);
    else console.log("training_program months:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
