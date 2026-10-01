const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log("A79 merged:", ws.getCell("A79").isMerged, ws.getCell("A79").master.address);
    console.log("K83 merged:", ws.getCell("K83").isMerged, ws.getCell("K83").master.address);
    console.log("K84 merged:", ws.getCell("K84").isMerged, ws.getCell("K84").master.address);
}
read();
