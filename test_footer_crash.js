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
    
    let startRow = 10;
    let footerRow = ws.rowCount;
    for (let r = startRow; r <= ws.rowCount; r++) {
        const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
        if (val.match(/Leyenda|Cumplimiento/i)) {
            footerRow = r;
            break;
        }
    }

    // Only strip formulas BEFORE footerRow
    for (let r = startRow; r < footerRow; r++) {
        const row = ws.getRow(r);
        row.eachCell(cell => {
            if (cell.type === ExcelJS.ValueType.Formula) {
                cell.value = cell.result !== undefined ? cell.result : null;
            }
        });
    }

    // Try to insert a row
    try {
        ws.insertRow(15, []);
        console.log("Insert row successful!");
    } catch (err) {
        console.error("Crash!", err);
    }
    
    await client.end();
}
run().catch(console.error);
