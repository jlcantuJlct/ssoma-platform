const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /const isBotiquin = data\.isBotiquinesMatrix \|\| \(moduleName && moduleName\.toLowerCase\(\)\.includes\("botiquin"\)\);/,
    `const isBotiquin = data.isBotiquinesMatrix || (moduleName && (moduleName.toLowerCase().includes("botiquin") || moduleName.toLowerCase().includes("botiquín")));`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Fixed Botiquin string matching for accent in export-excel");
