const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(
    /data\.finding\.moduleName\.toLowerCase\(\)\.includes\('electrica'\)\)\) \{/g,
    `data.finding.moduleName.toLowerCase().includes('electrica') || data.finding.moduleName.toLowerCase().includes('cocina') || data.finding.moduleName.toLowerCase().includes('comedor'))) {`
);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed Levantamiento splitting for Cocina y Comedor');
