
const ExcelJS = require('exceljs');
async function check() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Kit con derrames.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log('Row 4:');
    ws.getRow(4).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 5:');
    ws.getRow(5).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 6:');
    ws.getRow(6).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 23:');
    ws.getRow(23).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 24:');
    ws.getRow(24).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 25:');
    ws.getRow(25).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 26:');
    ws.getRow(26).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
    
    console.log('Row 27:');
    ws.getRow(27).eachCell((c, cn) => console.log('  Col ' + cn + ' (' + c.address + '): ' + c.value));
}
check();

