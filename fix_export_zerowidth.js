const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `const matchKey = Object.keys(checklist).find(k => k.replace(/\\s+/g, ' ') === cellText);`;
const rep = `const matchKey = Object.keys(checklist).find(k => k.replace(/[\\u200B]/g, '').trim().replace(/\\s+/g, ' ') === cellText);`;
c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export-excel to strip zero-width spaces');
