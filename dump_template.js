const { Client } = require('pg');
const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query("SELECT file_data FROM program_templates WHERE tipo = 'capacitacion'");
    if (res.rows.length === 0) {
        console.log("No template found");
        return;
    }
    const buf = Buffer.from(res.rows[0].file_data, 'base64');
    fs.writeFileSync('template.xlsx', buf);
    console.log("Template saved to template.xlsx");
    
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    for (let r = 40; r <= 55; r++) {
        const row = ws.getRow(r);
        console.log(`Row ${r}: A='${row.getCell(1).value}', B='${row.getCell(2).value}', C='${row.getCell(3).value}'`);
    }
    process.exit(0);
}
run();
