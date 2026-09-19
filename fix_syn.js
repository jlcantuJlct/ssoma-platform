const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(/tipoText = "    \r?\nPlaneada:/g, 'tipoText = "    \\nPlaneada:');
c = c.replace(/`A\\\${/g, '`A${');
c = c.replace(/`B\\\${/g, '`B${');
c = c.replace(/`J\\\${/g, '`J${');
c = c.replace(/`K\\\${/g, '`K${');
c = c.replace(/`L\\\${/g, '`L${');
c = c.replace(/`N\\\${/g, '`N${');
c = c.replace(/`P\\\${/g, '`P${');
c = c.replace(/`U\\\${/g, '`U${');
c = c.replace(/\\\${/g, '${');
c = c.replace(/`A\\23`/g, '`A23`');
c = c.replace(/`A\\26`/g, '`A26`');
c = c.replace(/`M\\26`/g, '`M26`');
c = c.replace(/`P\\26`/g, '`P26`');

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed syntax!');
