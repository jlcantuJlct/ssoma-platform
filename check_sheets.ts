import client from './lib/db';
import ExcelJS from 'exceljs';

async function run() {
    const templateRow = await client.fetchOne("SELECT file_data FROM program_templates WHERE tipo = 'capacitacion'");
    if (templateRow && templateRow.file_data) {
        let wb = new ExcelJS.Workbook();
        await wb.xlsx.load(Buffer.from(templateRow.file_data, 'base64'));
        console.log("Worksheets in Capacitaciones template:");
        wb.worksheets.forEach((ws, i) => {
            console.log(`Sheet ${i}: name='${ws.name}', hidden=${ws.state}, rowCount=${ws.rowCount}`);
        });
    } else {
        console.log("No template found.");
    }
}
run();
