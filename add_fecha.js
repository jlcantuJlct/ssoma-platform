const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function run() {
    const res = await pool.query('SELECT items_json FROM templates_config WHERE id = 23');
    const items = JSON.parse(res.rows[0].items_json);
    if (!items.find(i => i.text === 'Fecha:')) {
        items.splice(2, 0, { text: 'Fecha:', type: 'question' });
        await pool.query('UPDATE templates_config SET items_json = $1 WHERE id = 23', [JSON.stringify(items)]);
        console.log('Added Fecha!');
    }
    pool.end();
}
run();
