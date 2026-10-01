const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(
    /if \(moduleName\.toLowerCase\(\)\.includes\('eléctrica'\) \|\| moduleName\.toLowerCase\(\)\.includes\('electrica'\)\) \{\n\s*return <InstalacionesElectricasCustomForm SignaturePad=\{SignaturePad\} \/>;\n\s*\}/g,
    `if (moduleName.toLowerCase().includes('eléctrica') || moduleName.toLowerCase().includes('electrica')) {\n        return <InstalacionesElectricasCustomForm SignaturePad={SignaturePad} />;\n    }\n    if (moduleName.toLowerCase().includes('cocina') || moduleName.toLowerCase().includes('comedor')) {\n        return <CocinaComedorCustomForm SignaturePad={SignaturePad} />;\n    }`
);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Router patched successfully for real');
