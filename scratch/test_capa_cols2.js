const ExcelJS = require('exceljs');
const { Client } = require('pg');
const client = new Client({ 
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT file_data FROM program_templates WHERE tipo = 'capacitacion'");
    const buf = Buffer.from(res.rows[0].file_data, 'base64');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    
    for(let r=6; r<=8; r++) {
        let text = `Row ${r}: `;
        for(let c=1; c<=12; c++) {
            text += `[C${c}: ${ws.getRow(r).getCell(c).value}] `;
        }
        console.log(text);
    }
    
    await client.end();
}
run().catch(console.error);
