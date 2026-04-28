
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkNames() {
    const records = await sql`SELECT responsable, responsible FROM evidence_center_records LIMIT 20`;
    console.log("Evidencias:");
    records.forEach(r => console.log(r.responsable || r.responsible));

    const program = await sql`SELECT data_json FROM annual_program LIMIT 1`;
    console.log("Programa:");
    if (program.length > 0) {
        const items = JSON.parse(program[0].data_json);
        items.slice(0, 10).forEach(i => console.log(i.responsible || i.responsable));
    }
}

checkNames();
