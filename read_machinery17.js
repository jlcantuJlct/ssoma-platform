const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let res = [];
    for (let r=10; r<=75; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            const val = String(cell.value).trim();
            if (val.toUpperCase().includes('ASFALTO')) {
                res.push(cell.address + ': ' + val);
            }
        });
    }
    console.log([...new Set(res)].join('\n'));
}
read();
