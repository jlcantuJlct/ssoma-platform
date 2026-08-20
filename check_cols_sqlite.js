const ExcelJS = require('exceljs');
const sqlite3 = require('better-sqlite3');
const fs = require('fs');

let dbPath = './ssoma.db';
if (fs.existsSync('./.data/ssoma.db')) {
    dbPath = './.data/ssoma.db';
}
const db = new sqlite3(dbPath); // using better-sqlite3

async function run() {
    const row = db.prepare("SELECT file_data FROM program_templates WHERE tipo = 'actividades'").get();
    if (!row) throw new Error("No data");
    const buf = Buffer.from(row.file_data, 'base64');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    
    const out = [];
    for(let r=9; r<=11; r++) {
        const rowObj = ws.getRow(r);
        let rowData = `Row ${r}: `;
        for(let c=7; c<=120; c++) {
            const val = rowObj.getCell(c).value;
            if(val !== null && val !== undefined && val !== '') rowData += `[${c}:${val}] `;
        }
        out.push(rowData);
    }
    console.log(out.join('\n'));
    db.close();
}
run().catch(console.error);
