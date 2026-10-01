const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('InstalacionesElectricasCustomForm')) {
    c = c.replace(
        "import CampamentoCustomForm from '@/components/inspections/CampamentoCustomForm';",
        "import CampamentoCustomForm from '@/components/inspections/CampamentoCustomForm';\nimport InstalacionesElectricasCustomForm from '@/components/inspections/InstalacionesElectricasCustomForm';"
    );
    
    c = c.replace(
        "if (moduleLower.includes('campamento')) {",
        "if (moduleLower.includes('eléctrica') || moduleLower.includes('electrica')) {\n            return <InstalacionesElectricasCustomForm SignaturePad={SignaturePad} />;\n        }\n\n        if (moduleLower.includes('campamento')) {"
    );
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log('Updated page.tsx');
} else {
    console.log('Already updated');
}
