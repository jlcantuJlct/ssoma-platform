const ExcelJS = require('exceljs');
const { Client } = require('pg');
const client = new Client({ 
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT file_data FROM program_templates WHERE tipo = 'actividades'");
    const buf = Buffer.from(res.rows[0].file_data, 'base64');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    
    for(let r=7; r<=10; r++) {
        const rowObj = ws.getRow(r);
        let rowData = `Row ${r}: `;
        for(let c=100; c<=120; c++) {
            let val = rowObj.getCell(c).value;
            if (val && typeof val === 'object') {
                 if (val.richText) val = val.richText.map(rt => rt.text).join('');
                 else val = JSON.stringify(val);
            }
            rowData += `[C${c}:${val}] `;
        }
        console.log(rowData);
    }
    await client.end();
}
run().catch(console.error);
