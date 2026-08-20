require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg'); 
const client = new Client({ connectionString: process.env.POSTGRES_URL.replace('5432', '6543'), ssl: { rejectUnauthorized: false } }); 
client.connect()
.then(() => client.query(
    `INSERT INTO presence_records (username, name, last_seen, location, focusedField) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (username) 
     DO UPDATE SET name = EXCLUDED.name, last_seen = EXCLUDED.last_seen, location = EXCLUDED.location, focusedField = EXCLUDED.focusedField
     RETURNING *`,
    ['test.bot.3', 'Test Bot 3', Date.now(), 'loc3', 'focus3']
))
.then(r => console.log('INSERT RESULT:', r.rows))
.catch(e => console.error('ERROR:', e.message))
.finally(() => client.end());
