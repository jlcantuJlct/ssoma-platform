const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de campamento.xlsx'));
  const worksheet = workbook.worksheets[0];
  
  for (let r = 10; r <= 14; r++) {
    for (let c = 8; c <= 12; c++) {
      let val = worksheet.getCell(r, c).value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      console.log(`Row ${r} Col ${c}: ${val}`);
    }
  }
}
run();
