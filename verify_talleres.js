const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Talleres.xlsx');
    const sheet = workbook.worksheets[0];
    
    console.log("D4:", sheet.getCell("D4").value);
    console.log("D5:", sheet.getCell("D5").value);
    console.log("K5:", sheet.getCell("K5").value);
    console.log("D6:", sheet.getCell("D6").value);
    console.log("D7:", sheet.getCell("D7").value);
    console.log("D8:", sheet.getCell("D8").value);
    console.log("K6:", sheet.getCell("K6").value);
    console.log("K8:", sheet.getCell("K8").value);
    console.log("A38 (Observaciones):", sheet.getCell("A38").value);
}
run();
