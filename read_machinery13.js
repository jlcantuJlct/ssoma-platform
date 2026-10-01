const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    for (let r=10; r<=75; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            const val = String(cell.value);
            if (val === 'MOTONIVELADORAS' || val === 'CARGADOR FRONTAL' || val === 'RODILLOS' || val === 'RETROEXCAVADORAS' || val === 'MINICARGADORES' || val === 'PAVIMENTADORAS') {
                console.log('Row ' + r + ' Col ' + cell.col + ': ' + val);
            }
        });
    }
}
read();
