import { Client } from 'pg';
import ExcelJS from 'exceljs';

async function run() {
    const client = new Client({
        connectionString: 'postgres://default:A6uXvcdiHn7E@ep-damp-lab-a4t3x53e-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require'
    });
    await client.connect();
    
    const res = await client.query("SELECT tipo, file_data FROM program_templates");
    for (const row of res.rows) {
        if (!row.file_data) continue;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(Buffer.from(row.file_data, 'base64'));
        console.log(`\nTemplate: ${row.tipo}`);
        console.log(`Total sheets: ${wb.worksheets.length}`);
        wb.worksheets.forEach((ws, i) => {
            console.log(`  Sheet ${i}: Name="${ws.name}", State="${ws.state}"`);
        });
        if (wb.views && wb.views.length > 0) {
            console.log(`  Active tab: ${wb.views[0].activeTab}`);
        }
    }
    
    await client.end();
}
run();
