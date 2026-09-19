const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const worksheet = wb.worksheets[0];
    
    let finalObsText = 'Hallazgos Registrados:\n- Superficies en buenas condiciones (NC)';
    worksheet.getCell('A57').value = finalObsText;
    await wb.xlsx.writeFile('test_campamento_obs.xlsx');
    console.log("Wrote test file");
}
run();
