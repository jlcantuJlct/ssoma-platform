const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  const query = "SELECT date, tema, area, tipo FROM training_program WHERE date LIKE '%-08-%' ORDER BY date ASC;";
  db.all(query, (err, rows) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(rows, null, 2));
  });
});
db.close();
