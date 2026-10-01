const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
const match = c.match(/let moduleName = (.*?);/g);
console.log(match);
