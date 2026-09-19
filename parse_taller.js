const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de Talleres.xlsx'));
  const worksheet = workbook.worksheets[0];
  let items = [];
  for (let i = 15; i <= 35; i++) {
    const val = worksheet.getCell(`B${i}`).value;
    if (val) {
        let text = typeof val === 'object' && val.richText ? val.richText.map(t => t.text).join('') : String(val);
        items.push(text.trim());
    }
  }
  console.log(JSON.stringify(items, null, 2));
}
run();
