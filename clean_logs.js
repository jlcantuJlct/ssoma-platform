const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
c = c.replace(/console\.log\('Writing x to ', rowNum, colNum \+ offset, 'for', cleanText\);/g, '');
c = c.replace(/if \(cleanText === 'Llantas delanteras \(\*\)'\) console\.log\('Found llantas!', checklist\[cleanText\]\);/g, '');
fs.writeFileSync('app/api/export-excel/route.ts', c);
