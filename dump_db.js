const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query("SELECT data_json FROM annual_program WHERE objective_id = 'obj10'");
    if (res.rows.length === 0) {
        console.log("No data");
        return;
    }
    const data = JSON.parse(res.rows[0].data_json);
    console.log("OBJ10 ACTIVITIES:");
    for (const item of data) {
        console.log("-", item.description);
    }
    process.exit(0);
}
run();
