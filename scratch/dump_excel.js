const xlsx = require('xlsx');
const wb = xlsx.readFile('programa_formacion_test.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });
const fs = require('fs');
fs.writeFileSync('scratch/excel_dump.json', JSON.stringify(data, null, 2));
console.log('Dumped to scratch/excel_dump.json');
