const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/POSTGRES_URL="?([^"\n]+)"?/)[1].replace('5432', '6543');
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    const res = await client.query('SELECT * FROM epp_inventory_log ORDER BY id ASC');
    const invRecords = res.rows;

    const map = {};
    invRecords.forEach(r => {
        if (!map[r.item_name]) {
            map[r.item_name] = { in: 0, out: 0, unit: r.unit };
        }
        if (r.type === 'IN') map[r.item_name].in += r.quantity;
        if (r.type === 'OUT') map[r.item_name].out += r.quantity;
    });

    const arr = Object.entries(map).map(([name, data]) => ({
        name,
        in: data.in,
        out: data.out,
        saldo: data.in - data.out
    })).filter(x => x.name.includes('Badana'));

    console.log(arr);

    await client.end();
}
run();
