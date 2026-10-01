const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let r = 56; r <= 61; r++) {
        const cell = sheet.getCell(`A${r}`);
        console.log(`Row ${r}: isMerged=${cell.isMerged}, master=${cell.master.address}`);
    }
}
run();
