const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("else if (isInternas) {", "else if (isInternas) {\nconsole.log('INTERNAS EXECUTING!');\nconsole.log('Template length:', (template||[]).length);\nconsole.log('Answers length:', (answers||[]).length);\nconsole.log('First answer:', answers?.[0]);\n");

fs.writeFileSync(path, code);
console.log("Injected log");
