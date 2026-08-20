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
    
    const out = [];
    for(let r=5; r<=9; r++) {
        const rowObj = ws.getRow(r);
        let rowData = `Row ${r}: `;
        for(let c=7; c<=80; c++) {
            const val = rowObj.getCell(c).value;
            if(val !== null && val !== undefined && val !== '') {
                const str = typeof val === 'object' ? JSON.stringify(val) : val;
                rowData += `[C${c}:${str}] `;
            }
        }
        out.push(rowData);
    }
    console.log(out.join('\n'));
    await client.end();
}
run().catch(console.error);
