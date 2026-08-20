const ExcelJS = require('exceljs');
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/ssoma' });

async function run() {
    await client.connect();
    const res = await client.query("SELECT file_data FROM program_templates WHERE tipo = 'actividades'");
    const buf = Buffer.from(res.rows[0].file_data, 'base64');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    
    const out = [];
    for(let r=9; r<=11; r++) {
        const row = ws.getRow(r);
        let rowData = `Row ${r}: `;
        for(let c=7; c<=115; c++) {
            const val = row.getCell(c).value;
            if(val) rowData += `[${c}:${val}] `;
        }
        out.push(rowData);
    }
    console.log(out.join('\n'));
    await client.end();
}
run();
