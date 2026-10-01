const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let res = [];
    for (let r=30; r<=100; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.value && (String(cell.value).includes('OBSERVACIONES') || String(cell.value).includes('Operador') || String(cell.value).includes('Capataz') || String(cell.value).includes('V°B°'))) {
                res.push(cell.address + ': ' + cell.value);
            }
        });
    }
    console.log(res.join('\n'));
}
read();
