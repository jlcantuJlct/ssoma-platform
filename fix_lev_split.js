const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(
    /data\.finding\.moduleName\.toLowerCase\(\)\.includes\('campamento'\)\)\) \{/g,
    `data.finding.moduleName.toLowerCase().includes('campamento') || data.finding.moduleName.toLowerCase().includes('eléctrica') || data.finding.moduleName.toLowerCase().includes('electrica'))) {`
);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed Levantamiento splitting for Instalaciones Electricas');
