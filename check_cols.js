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
    
    const row9 = ws.getRow(9);
    const row10 = ws.getRow(10);
    const row11 = ws.getRow(11);
    
    let out = [];
    for(let c=7; c<=120; c++) {
        const v9 = row9.getCell(c).value;
        const v10 = row10.getCell(c).value;
        const v11 = row11.getCell(c).value;
        if(v9 || v10 || v11) {
            out.push(`Col ${c}: 9=${v9}, 10=${v10}, 11=${v11}`);
        }
    }
    console.log(out.join('\n'));
    await client.end();
}
run();
