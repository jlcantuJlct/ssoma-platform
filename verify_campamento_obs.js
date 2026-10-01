const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    const cell = sheet.getCell("A57");
    if(cell.isMerged) {
        // find bounds of merge
        const model = cell.worksheet.model;
        model.merges.forEach(m => {
            if(m.includes('A57')) console.log("Merge bounds for A57:", m);
        });
    }
}
run();
