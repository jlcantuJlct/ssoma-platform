const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(
    "if (moduleName.toLowerCase().includes('campamento')) {",
    "if (moduleName.toLowerCase().includes('eléctrica') || moduleName.toLowerCase().includes('electrica')) {\n        return <InstalacionesElectricasCustomForm SignaturePad={SignaturePad} />;\n    }\n\n    if (moduleName.toLowerCase().includes('campamento')) {"
);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Fixed routing in page.tsx');
