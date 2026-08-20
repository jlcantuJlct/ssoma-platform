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
    
    for(let r=16; r<=21; r++) {
        const row = ws.getRow(r);
        let fills = `Row ${r} Fills: `;
        for(let c=1; c<=4; c++) {
            const fill = row.getCell(c).style.fill;
            fills += `[C${c}: ${fill ? (fill.fgColor ? fill.fgColor.argb : 'has-fill') : 'none'}] `;
        }
        for(let c=7; c<=9; c++) {
            const fill = row.getCell(c).style.fill;
            fills += `[C${c}: ${fill ? (fill.fgColor ? fill.fgColor.argb : 'has-fill') : 'none'}] `;
        }
        console.log(fills);
    }
    
    await client.end();
}
run().catch(console.error);
