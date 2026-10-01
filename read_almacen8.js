const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    for(let r=81; r<=100; r++) {
        let rowStr = `${r}: `;
        for(let c=1; c<=12; c++) {
            let val = ws.getCell(r, c).value;
            if(val) rowStr += `[C${c}: ${typeof val === 'object' ? JSON.stringify(val) : val}] `;
        }
        if(rowStr.length > 5) console.log(rowStr);
    }
}
run();
