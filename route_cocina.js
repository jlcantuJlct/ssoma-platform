const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('CocinaComedorCustomForm')) {
    c = c.replace(
        /import InstalacionesElectricasCustomForm from '@\/components\/inspections\/InstalacionesElectricasCustomForm';/g,
        `import InstalacionesElectricasCustomForm from '@/components/inspections/InstalacionesElectricasCustomForm';\nimport CocinaComedorCustomForm from '@/components/inspections/CocinaComedorCustomForm';`
    );
    
    c = c.replace(
        /if \(norm === 'instalacioneselectricas' \|\| norm\.includes\('eléctrica'\) \|\| norm\.includes\('electrica'\)\) \{\n\s*return <InstalacionesElectricasCustomForm \/>;\n\s*\}/g,
        `if (norm === 'instalacioneselectricas' || norm.includes('eléctrica') || norm.includes('electrica')) {\n        return <InstalacionesElectricasCustomForm />;\n    }\n    if (norm.includes('cocina') || norm.includes('comedor')) {\n        return <CocinaComedorCustomForm />;\n    }`
    );
    
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log('Added router for Cocina y Comedor');
}
