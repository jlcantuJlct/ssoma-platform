const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    try {
        sheet.mergeCells("A57:M61");
        console.log("Merge successful");
    } catch(e) {
        console.error("Merge failed:", e.message);
    }
}
run();
