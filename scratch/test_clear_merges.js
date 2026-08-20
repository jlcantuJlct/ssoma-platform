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
    
    let startRow = 16;
    let footerRow = 34;
    
    if (ws._merges) {
        const mergesToClear = [];
        for (const rangeStr of Object.keys(ws._merges)) {
            const m = ws._merges[rangeStr].model;
            if (m.top >= startRow && m.bottom < footerRow) {
                mergesToClear.push(rangeStr);
            }
        }
        mergesToClear.forEach(r => {
            console.log("Unmerging:", r);
            ws.unMergeCells(r);
        });
    }
    
    console.log("Remaining B merges:");
    for (const rangeStr of Object.keys(ws._merges)) {
        if (rangeStr.startsWith('B')) console.log(rangeStr);
    }
    
    await client.end();
}
run().catch(console.error);
