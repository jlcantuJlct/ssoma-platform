require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@vercel/postgres');

async function test() {
    const client = createClient();
    await client.connect();
    try {
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'residuos_certificados'");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
test();
