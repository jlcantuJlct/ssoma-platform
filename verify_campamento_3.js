const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    for (let r=4; r<=8; r++) {
        for (let c=1; c<=12; c++) {
            const cell = sheet.getCell(r, c);
            if (!cell.isMerged || cell.master.address === cell.address) {
                console.log(`Row ${r} Col ${c} (${cell.address}): isMerged=${cell.isMerged}, value=${cell.value}`);
            }
        }
    }
}
run();
