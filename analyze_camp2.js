const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de campamento.xlsx'));
  const worksheet = workbook.worksheets[0];
  
  for (let r = 46; r <= 60; r++) {
      let val = worksheet.getCell(r, 2).value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      if (val) {
        console.log(`Grid Item Row ${r}: ${val}`);
      }
  }

  // Look for comments block
  for (let r = 50; r <= 60; r++) {
      let val = worksheet.getCell(r, 1).value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      if (val) {
        console.log(`Row ${r} Col 1: ${val}`);
      }
  }
}
run();
