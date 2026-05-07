const { db } = require('@vercel/postgres');
async function main() {
    const c = await db.connect();
    const r = await c.query("SELECT * FROM pma_evidence_records WHERE date='2026-04-27'");
    console.log(r.rows);
    c.release();
}
main();
