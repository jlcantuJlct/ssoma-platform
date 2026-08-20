const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log(Object.keys(pkg.dependencies).filter(d => d.includes('xlsx')));
