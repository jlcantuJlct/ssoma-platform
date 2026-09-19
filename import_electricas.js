const { Pool } = require('pg');
const ExcelJS = require('exceljs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

function getSafeText(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object' && cell.value.richText) {
        return cell.value.richText.map(t => t.text).join('').trim();
    }
    return String(cell.value).trim();
}

async function run() {
    try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
        const ws = wb.worksheets[0];
        
        let detectedItems = [];
        let items = [];

        // Meta
        items.push({ text: "Proyecto:", type: "question" });
        items.push({ text: "Área específica de inspección:", type: "question" });
        items.push({ text: "Inspector:", type: "question" });
        items.push({ text: "Cargo:", type: "question" });
        items.push({ text: "Responsable de Área:", type: "question" });
        
        // Options
        items.push({ text: "Inspección planificada", type: "question" });
        items.push({ text: "Inspección no planificada", type: "question" });
        items.push({ text: "Otro", type: "question" });

        // Titles and Questions
        for (let r = 14; r <= 46; r++) {
            const val = getSafeText(ws.getCell('B' + r));
            if (!val || val.length < 5) continue;
            
            // If it has C NC N/A on row, it's a title, except 46 which is obs
            const k = getSafeText(ws.getCell('K' + r));
            if (k === 'C') {
                items.push({ text: val, type: "title" });
            } else if (val === 'Comentarios u observaciones adicionales') {
                items.push({ text: val, type: "question" });
            } else {
                items.push({ text: val, type: "question" });
            }
        }

        const name = "Inspección de Instalaciones Eléctricas";
        
        // Insert DB
        const res = await pool.query(
            "INSERT INTO templates_config (module_name, version, items_json) VALUES ($1, $2, $3) RETURNING id",
            [name, 1, JSON.stringify(items)]
        );
        console.log("Inserted as ID:", res.rows[0].id);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
