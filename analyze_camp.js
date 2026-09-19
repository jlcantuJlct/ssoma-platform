const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de campamento.xlsx'));
  const worksheet = workbook.worksheets[0];
  
  // Find where labels like "Proyecto", "Fecha", etc. are
  for (let r = 4; r <= 10; r++) {
    for (let c = 1; c <= 10; c++) {
      let val = worksheet.getCell(r, c).value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      if (val) {
        console.log(`Row ${r} Col ${c}: ${val}`);
      }
    }
  }

  // Find where items start
  for (let r = 11; r <= 45; r++) {
      let val = worksheet.getCell(r, 2).value;
      if (val && typeof val === 'object' && val.richText) val = val.richText.map(t=>t.text).join('');
      if (val) {
        console.log(`Grid Item Row ${r}: ${val}`);
      }
  }
}
run();
