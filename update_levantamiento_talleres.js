const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(/\|\| finding.moduleName.toLowerCase\(\).includes\('almac'\)/, "|| finding.moduleName.toLowerCase().includes('almac') || finding.moduleName.toLowerCase().includes('taller')");

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Talleres configured in levantamiento page');
