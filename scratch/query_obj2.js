require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query("SELECT * FROM annual_program WHERE objective_id = 'obj2'");
        console.log(res.rows[0].data_json.substring(0, 1000));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
