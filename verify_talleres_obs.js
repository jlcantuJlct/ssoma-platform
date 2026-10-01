const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Talleres.xlsx');
    const sheet = workbook.worksheets[0];
    const obsCell = sheet.getCell("A38");
    console.log("A38 isMerged:", obsCell.isMerged);
    if(obsCell.isMerged) {
        console.log("Master:", obsCell.master.address);
    }
    
    // Also check A39, A40
    console.log("A39 isMerged:", sheet.getCell("A39").isMerged);
    if(sheet.getCell("A39").isMerged) console.log("A39 Master:", sheet.getCell("A39").master.address);
}
run();
