const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("PRAGMA table_info(training_program);", (err, rows) => {
    if (err) console.error(err);
    else console.log("training_program schema:\n", JSON.stringify(rows, null, 2));
  });

  db.all("SELECT * FROM training_program LIMIT 10;", (err, rows) => {
    if (err) console.error(err);
    else console.log("training_program sample data:\n", JSON.stringify(rows, null, 2));
  });
});
db.close();
