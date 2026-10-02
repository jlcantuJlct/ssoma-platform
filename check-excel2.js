
const ExcelJS = require('exceljs');
async function check() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Kit con derrames.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log('Merge ranges:');
    Object.values(ws._merges).forEach(m => console.log('  ' + m));
    
    console.log('Row 28:');
    ws.getRow(28).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    console.log('Row 29:');
    ws.getRow(29).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
}
check();

