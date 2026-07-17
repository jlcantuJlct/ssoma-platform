const db = require('better-sqlite3')('ssoma.db');
const rows = db.prepare("SELECT * FROM training_program WHERE date LIKE '%06%'").all();
console.log(rows);
