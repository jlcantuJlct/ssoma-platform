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
    
    const monthTargetColsP = [];
    const row7 = ws.getRow(7);
    const MONTH_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    
    for (const mName of MONTH_NAMES) {
        let maxC = -1;
        for (let c = 7; c <= 112; c++) {
            const val = String(row7.getCell(c).value || '').trim().toUpperCase();
            if (val === mName) {
                maxC = c;
            }
        }
        if (maxC !== -1) {
            monthTargetColsP.push(maxC - 1); // maxC is E, so maxC - 1 is P
        } else {
            // Fallback just in case a month is missing
            monthTargetColsP.push(7 + monthTargetColsP.length * 8); 
        }
    }
    console.log(monthTargetColsP);
    await client.end();
}
run().catch(console.error);
