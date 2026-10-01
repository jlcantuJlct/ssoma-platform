const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('return <CocinaComedorCustomForm />')) {
    c = c.replace(
        /return <InstalacionesElectricasCustomForm \/>;\s*\}/g,
        `return <InstalacionesElectricasCustomForm />;\n    }\n    if (norm.includes('cocina') || norm.includes('comedor')) {\n        return <CocinaComedorCustomForm />;\n    }`
    );
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log('Router patched successfully');
}
