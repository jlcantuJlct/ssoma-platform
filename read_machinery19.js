const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let res = [];
    for (let r=14; r<=28; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.col >= 10 && cell.col <= 12) {
                res.push(cell.address + ': ' + cell.value);
            }
        });
    }
    console.log([...new Set(res)].join('\n'));
}
read();
