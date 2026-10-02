
const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const botiquinRegex = /const isBotiquin = data.isBotiquinesMatrix[^;]+;/;
code = code.replace(botiquinRegex, 'const isKitAntiderrame = data.isKitAntiderrameMatrix || (moduleName && moduleName.toLowerCase().includes(\'derrame\'));\n      ' + code.match(botiquinRegex)[0]);

const pathRegex = /if \\(isBotiquin\\) \\{ const alt = path\\.join[^}]+} /;
if (code.match(pathRegex)) {
   code = code.replace(pathRegex, 'if (isKitAntiderrame) { const alt = path.join(process.cwd(), \'public\', \'templates\', \'digital\', \'Inspección de Kit con derrames.xlsx\'); if(fs.existsSync(alt)) templatePath = alt; }\n      ' + code.match(pathRegex)[0]);
}

fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('patched successfully');

