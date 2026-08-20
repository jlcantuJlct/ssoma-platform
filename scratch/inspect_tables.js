const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    console.log("Tables:", tables.map(t => t.name).join(', '));
  });

  db.all("SELECT * FROM activities LIMIT 5;", (err, rows) => {
    console.log("activities sample:", JSON.stringify(rows, null, 2));
  });

  db.all("SELECT * FROM monthly_program_records LIMIT 5;", (err, rows) => {
    console.log("monthly_program_records sample:", JSON.stringify(rows, null, 2));
  });

  // Query what's currently in training_program for August 2026? 
  // Maybe the date format is different, e.g., '08/2026' or '26-08'
  db.all("SELECT date, tema, area, tipo FROM training_program ORDER BY date DESC LIMIT 10;", (err, rows) => {
    console.log("training_program latest:", JSON.stringify(rows, null, 2));
  });

  db.all("SELECT date, tema, area FROM training_program WHERE date LIKE '%08%' LIMIT 10;", (err, rows) => {
    console.log("training_program LIKE '%08%':", JSON.stringify(rows, null, 2));
  });

});
db.close();
