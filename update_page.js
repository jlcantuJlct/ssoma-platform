const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[id]/fill/page.tsx', 'utf8');

if (!c.includes('InstalacionesElectricasCustomForm')) {
    c = c.replace(
        "import EppCustomForm from '@/components/inspections/EppCustomForm';",
        "import EppCustomForm from '@/components/inspections/EppCustomForm';\nimport InstalacionesElectricasCustomForm from '@/components/inspections/InstalacionesElectricasCustomForm';"
    );
    
    // The switch statement or if statement
    c = c.replace(
        "if (inspectionId.toLowerCase().includes('campamento')) {",
        "if (inspectionId.toLowerCase().includes('instalaciones el') || inspectionId.toLowerCase().includes('instalaciones-el')) {\n            return <InstalacionesElectricasCustomForm templatePath={templatePath} templateInfo={templateInfo} />;\n        }\n\n        if (inspectionId.toLowerCase().includes('campamento')) {"
    );
    fs.writeFileSync('app/digital-inspections/[id]/fill/page.tsx', c);
    console.log('Updated page.tsx');
} else {
    console.log('Already updated');
}
