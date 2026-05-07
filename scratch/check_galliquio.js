const { db } = require('@vercel/postgres');

async function main() {
    const client = await db.connect();
    const res = await client.query(`SELECT responsible, category, date, location FROM pma_evidence_records WHERE responsible ILIKE '%Galliqui%'`);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.release();
}
main().catch(console.error);
