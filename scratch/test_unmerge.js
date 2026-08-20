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
    
    // Unmerge all cells in column 1 and 2 from startRow
    const startRow = 16;
    const mergesToUnmerge = [];
    if (ws._merges) {
        for (const rangeStr of Object.keys(ws._merges)) {
            // A range looks like "B16:B18" or just "B16" if it's stored differently?
            // Actually, ws._merges stores objects or range strings
            const merge = ws._merges[rangeStr];
            console.log("RangeStr:", rangeStr, "Model:", merge.model);
        }
    }
    
    await client.end();
}
run().catch(console.error);
