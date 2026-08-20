import client from './lib/db';
import ExcelJS from 'exceljs';

async function run() {
    const templateRow = await client.fetchOne("SELECT file_data FROM program_templates WHERE tipo = 'capacitacion'");
    if (templateRow && templateRow.file_data) {
        let wb = new ExcelJS.Workbook();
        await wb.xlsx.load(Buffer.from(templateRow.file_data, 'base64'));
        const ws = wb.worksheets[0];
        console.log("Worksheet:", ws.name);
        
        let startRow = 9; 
        for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
            const cell = ws.getRow(r).getCell(1);
            if (cell.value === 1 || String(cell.value).match(/^\d+$/)) {
                startRow = r;
                break;
            }
        }
        console.log("StartRow:", startRow);
        
        const headerRow = ws.getRow(startRow - 1);
        const headerRow2 = ws.getRow(startRow - 2);
        
        for(let c=1; c<=40; c++) {
            const val1 = headerRow.getCell(c).value;
            const val2 = headerRow2.getCell(c).value;
            const str1 = val1 && typeof val1 === 'object' && 'richText' in val1 ? (val1 as any).richText.map((rt: any) => rt.text).join('') : String(val1 || '');
            const str2 = val2 && typeof val2 === 'object' && 'richText' in val2 ? (val2 as any).richText.map((rt: any) => rt.text).join('') : String(val2 || '');
            
            if (str1.trim() || str2.trim()) {
                console.log(`Col ${c}: [${str2.trim()}] [${str1.trim()}]`);
            }
        }
    } else {
        console.log("No template found.");
    }
}
run();
