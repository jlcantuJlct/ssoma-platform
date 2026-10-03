const fs = require('fs');
let code = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

code = code.replace(
    /if \(decodedModule\.toLowerCase\(\)\.includes\('estacion'\) \|\| decodedModule\.toLowerCase\(\)\.includes\('estación'\) \|\| decodedModule\.includes\('008'\)\) \{/g,
    "if (moduleName.toLowerCase().includes('estacion') || moduleName.toLowerCase().includes('estación') || moduleName.includes('008')) {"
);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', code);
