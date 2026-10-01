const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log("A79 master:", ws.getCell("A79").master ? ws.getCell("A79").master.address : "none");
    console.log("A80 master:", ws.getCell("A80").master ? ws.getCell("A80").master.address : "none");
}
read();
