const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let res = [];
    for (let r=1; r<=20; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.value) {
                res.push(cell.address + ': ' + (typeof cell.value === 'object' && cell.value.richText ? cell.value.richText.map(rt=>rt.text).join('') : cell.value));
            }
        });
    }
    console.log(res.join('\n'));
}
read();
