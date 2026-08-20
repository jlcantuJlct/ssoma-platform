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
    
    const startRow = 16;
    const refRow = ws.getRow(startRow);
    const styles = [];
    for(let c=1; c<=113; c++) {
        styles.push(JSON.parse(JSON.stringify(refRow.getCell(c).style)));
    }
    
    ws.insertRow(50, []);
    const newRow = ws.getRow(50);
    for(let c=1; c<=113; c++) {
        newRow.getCell(c).style = styles[c-1];
    }
    
    console.log("Success! Style applied.");
    await client.end();
}
run().catch(console.error);
