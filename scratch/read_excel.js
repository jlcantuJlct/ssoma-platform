const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('./programa_formacion_test.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Just dump the first 15 rows to understand the structure
  console.log(JSON.stringify(data.slice(0, 15), null, 2));
} catch (e) {
  console.error(e);
}
