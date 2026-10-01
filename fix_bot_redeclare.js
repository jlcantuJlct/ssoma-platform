const fs = require('fs');
let route = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Replace the first declaration with let or remove it
route = route.replace(
    /const isBotiquin =\s*moduleName && moduleName\.toLowerCase\(\)\.includes\("botiquin"\);/,
    `// removed old isBotiquin`
);

fs.writeFileSync('app/api/export-excel/route.ts', route);
console.log("Fixed redeclaration");
