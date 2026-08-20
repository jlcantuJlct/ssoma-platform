const { Pool } = require('pg');
const ExcelJS = require('exceljs');

const pool = new Pool({
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'
});

async function dump() {
    try {
        const res = await pool.query("SELECT file_data FROM program_templates WHERE tipo = 'inspeccion'");
        const buffer = Buffer.from(res.rows[0].file_data, 'base64');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0]; // Just use the first worksheet
        
        console.log(`Sheet name: ${ws.name}`);
        
        for (let r = 8; r <= 13; r++) {
            const row = ws.getRow(r);
            let vals = [];
            for (let c = 1; c <= 6; c++) {
                vals.push(String(row.getCell(c).value || '').trim().substring(0, 20));
            }
            console.log(`Row ${r}:`, vals.join(' | '));
        }
        
        process.exit(0);
    } catch(e) {
        console.log(e);
        process.exit(1);
    }
}
dump();
