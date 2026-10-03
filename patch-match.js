const fs = require('fs');
let code = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

code = code.replace(
    /if \(moduleName\.toLowerCase\(\)\.includes\('estación de emergencia'\) \|\| moduleName\.toLowerCase\(\)\.includes\('estacion de emergencia'\) \|\| moduleName\.toLowerCase\(\)\.includes\('primeros auxilios'\)\) \{/g,
    "if (decodedModule.toLowerCase().includes('estacion') || decodedModule.toLowerCase().includes('estación') || decodedModule.includes('008')) {"
);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', code);
