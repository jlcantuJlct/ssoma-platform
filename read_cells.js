const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de Talleres.xlsx'));
  const worksheet = workbook.worksheets[0];
  console.log("C4:", worksheet.getCell('C4').value);
  console.log("D5:", worksheet.getCell('D5').value);
  console.log("D6:", worksheet.getCell('D6').value);
  console.log("D7:", worksheet.getCell('D7').value);
  console.log("D8:", worksheet.getCell('D8').value);
}
run();
