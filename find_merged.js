const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de Talleres.xlsx'));
  const worksheet = workbook.worksheets[0];
  
  for (let r = 4; r <= 8; r++) {
    for (let c = 4; c <= 11; c++) { // D to K
      const cell = worksheet.getCell(r, c);
      let val = cell.value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      console.log(`Row ${r} Col ${c} (${cell.address}): ${val} - Merged: ${cell.isMerged ? cell.master.address : 'No'}`);
    }
  }
}
run();
