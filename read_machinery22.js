const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let items = {};
    for (let r=14; r<=75; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.col >= 10 || (cell.row >= 60 && cell.col >= 1)) { // Specific tables are J+ and A+ (for row 60+)
                const val = String(cell.value).trim();
                if (val !== 'OK' && val !== 'R' && val !== 'M' && val !== 'F' && val !== 'N/A' && val !== 'RESUM' && val !== 'FUGA' && val !== 'IMPLEMENTO' && val !== 'x') {
                    if (!items[val]) items[val] = [];
                    items[val].push(cell.col);
                }
            }
        });
    }
    for (let key in items) {
        let cols = [...new Set(items[key])];
        if (cols.length > 1 && !cols.every(c => Math.abs(cols[0]-c) <= 1)) {
             console.log(key + ' appears in columns: ' + cols.join(', '));
        }
    }
}
read();
