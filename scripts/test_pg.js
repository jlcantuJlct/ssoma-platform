const { Client } = require('pg');
const fs = require('fs');
async function run() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/POSTGRES_URL="?([^"\n]+)"?/)[1].replace('5432', '6543');
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query('SELECT * FROM epp_inventory_log ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
run();
