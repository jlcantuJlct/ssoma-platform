const { Client } = require('pg');

const connectionString = "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres";

async function testConnection() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
    try {
        await client.connect();
        console.log("SUCCESS: Connected to Supabase Session Pooler!");
        const res = await client.query("SELECT version()");
        console.log("Version:", res.rows[0].version);
    } catch (e) {
        console.error("FAILURE to connect:", e);
    } finally {
        await client.end();
    }
}

testConnection();
