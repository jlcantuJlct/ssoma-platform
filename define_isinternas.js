const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `const isLaboratorio = normName.includes('laboratorio');`;
const replacement = `const isInternas = normName.includes('internas');\n        const isLaboratorio = normName.includes('laboratorio');`;

if (!code.includes('const isInternas =')) {
    code = code.replace(target, replacement);
}

fs.writeFileSync(path, code);
console.log("Defined isInternas!");
