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
            if (['MAQUINARIA PESADA EN GENERAL', 'TRACTOR DE ORUGA', 'EXCAVADORAS', 'RETROEXCAVADORAS', 'MOTONIVELADORAS', 'CARGADOR FRONTAL', 'RODILLOS', 'MINICARGADORES', 'PAVIMENTADORAS'].includes(val.toUpperCase())) {
                res.push(cell.address + ': ' + val);
            }
        });
    }
    // De-duplicate
    console.log([...new Set(res)].join('\n'));
}
read();
