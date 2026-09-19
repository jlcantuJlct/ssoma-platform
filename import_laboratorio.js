const ExcelJS = require('exceljs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const getSafeText = (cell) => {
    if (!cell || !cell.value) return '';
    let val = cell.value;
    if (typeof val === 'object' && val.richText) val = val.richText.map(t => t.text).join('');
    return String(val).replace(/\r\n/g, '\n').trim();
};

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspección de Laboratorio.xlsx');
    const ws = wb.worksheets[0];
    
    let items = [];
    items.push({ text: "Proyecto:", type: "question" });
    items.push({ text: "Área específica de inspección:", type: "question" });
    items.push({ text: "Fecha:", type: "question" });
    items.push({ text: "Inspector:", type: "question" });
    items.push({ text: "Cargo:", type: "question" });
    items.push({ text: "Responsable de Área:", type: "question" });
    items.push({ text: "Inspección planificada", type: "question" });
    items.push({ text: "Inspección no planificada", type: "question" });
    items.push({ text: "Otro", type: "question" });
    
    items.push({ text: "Laboratorio", type: "title" });
    
    // Rows 15 to 33
    for (let r = 15; r <= 33; r++) {
        const val = getSafeText(ws.getCell('B' + r));
        if (val) {
            items.push({ text: val, type: "question" });
        }
    }
    
    items.push({ text: "Comentarios u observaciones adicionales", type: "question" });

    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const res = await pool.query(
        "INSERT INTO templates_config (module_name, items_json) VALUES ($1, $2) RETURNING id",
        ['Inspección de Laboratorio', JSON.stringify(items)]
    );
    console.log("Inserted template ID:", res.rows[0].id);
    
    // Delete any old conflicting module
    await pool.query("DELETE FROM inspection_modules WHERE name = 'Inspección de Laboratorio'");
    
    // Update the ID 10 which was "Inspección de Laboratorio" created on Sep 15
    const check10 = await pool.query("SELECT id FROM inspection_modules WHERE name = 'Inspección de Laboratorio'");
    if (check10.rows.length > 0) {
        await pool.query("UPDATE inspection_modules SET name = 'Inspección de Laboratorio (Old)' WHERE name = 'Inspección de Laboratorio'");
    }

    // Upsert the module
    await pool.query(
        "INSERT INTO inspection_modules (name, description, icon, status) VALUES ($1, $2, $3, $4)",
        ['Inspección de Laboratorio', 'F-SIG-077 Laboratorio', 'file', 'active']
    );
    
    console.log("Module updated!");
    pool.end();
}
run();
