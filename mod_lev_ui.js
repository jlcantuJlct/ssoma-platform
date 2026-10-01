const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(/const isMulti = finding\.moduleName\.toLowerCase\(\)\.includes\('maquina'\);/g, `const isMulti = finding.moduleName.toLowerCase().includes('maquina') || finding.moduleName.toLowerCase().includes('almac');`);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Added isMulti for Almacenes in levantamiento UI');
