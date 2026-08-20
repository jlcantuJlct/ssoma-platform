const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
    const buf = fs.readFileSync('./templates/F-SIG-023.xlsx');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    
    const out = [];
    for(let r=9; r<=11; r++) {
        const rowObj = ws.getRow(r);
        let rowData = `Row ${r}: `;
        for(let c=7; c<=120; c++) {
            const val = rowObj.getCell(c).value;
            if(val !== null && val !== undefined && val !== '') rowData += `[${c}:${val}] `;
        }
        out.push(rowData);
    }
    console.log(out.join('\n'));
}
run().catch(console.error);
