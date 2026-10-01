const fs = require('fs');

let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(
    /data\.finding\.moduleName\.toLowerCase\(\)\.includes\('botiquin'\)/,
    `data.finding.moduleName.toLowerCase().includes('botiquin') || data.finding.moduleName.toLowerCase().includes('botiquín')`
);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log("Fixed Botiquin string matching for accent in levantamiento page");
