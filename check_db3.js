const db = require('better-sqlite3')(__dirname + '/.data/ssoma.db');
console.log(db.prepare('PRAGMA table_info(presence_records)').all());
