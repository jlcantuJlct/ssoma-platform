const fs = require('fs');
const data = JSON.parse(fs.readFileSync('test_export.json', 'utf8'));
const base64Data = data.fileBase64;
fs.writeFileSync('test_machinery.xlsx', base64Data, 'base64');
console.log('Saved test_machinery.xlsx');
