const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    
    console.log("D4:", ws.getCell("D4").value, "D4 merged:", ws.getCell("D4").isMerged);
    console.log("C4:", ws.getCell("C4").value, "C4 merged:", ws.getCell("C4").isMerged);
    console.log("E4:", ws.getCell("E4").value, "E4 merged:", ws.getCell("E4").isMerged);
    console.log("F4:", ws.getCell("F4").value, "F4 merged:", ws.getCell("F4").isMerged);
    
    console.log("D5:", ws.getCell("D5").value, "D5 merged:", ws.getCell("D5").isMerged);
    console.log("K5:", ws.getCell("K5").value, "K5 merged:", ws.getCell("K5").isMerged);
    console.log("D6:", ws.getCell("D6").value, "D6 merged:", ws.getCell("D6").isMerged);
    console.log("D7:", ws.getCell("D7").value, "D7 merged:", ws.getCell("D7").isMerged);
    console.log("D8:", ws.getCell("D8").value, "D8 merged:", ws.getCell("D8").isMerged);
    
    console.log("A10:", ws.getCell("A10").value, "A11:", ws.getCell("A11").value, "A12:", ws.getCell("A12").value);
    
    // Checkmarks columns:
    console.log("K14:", ws.getCell("K14").value, "L14:", ws.getCell("L14").value);
    // So C is 11, NC is 12, what about NA? 
    // Wait, Leyenda: C, NC, N/A in columns K, L, M maybe?
    console.log("M14:", ws.getCell("M14").value);
}
run();
