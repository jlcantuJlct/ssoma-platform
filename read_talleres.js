const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Talleres.xlsx');
    const sheet = workbook.worksheets[0];
    
    console.log("--- Headings (Row 1-15) ---");
    for(let r=1; r<=15; r++) {
        let rowData = [];
        sheet.getRow(r).eachCell((cell, colNumber) => {
            if(cell.value) rowData.push(`Col ${colNumber}: ${cell.value}`);
        });
        if(rowData.length > 0) console.log(`Row ${r}: ` + rowData.join(' | '));
    }
    
    console.log("\n--- Checklist Items (Col B/C/D) ---");
    sheet.eachRow((row, rowNumber) => {
        if(rowNumber > 12 && rowNumber < 100) {
            const val = row.getCell(2).value || row.getCell(3).value || row.getCell(1).value;
            if(val && typeof val === 'string') {
                console.log(`Row ${rowNumber}: ${val.trim()}`);
            }
        }
    });
}
run();
