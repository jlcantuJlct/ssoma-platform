const fs = require('fs');

let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('BotiquinesCustomForm')) {
    c = c.replace(
        /import LaboratorioCustomForm from '@\/components\/inspections\/LaboratorioCustomForm';/g,
        `import LaboratorioCustomForm from '@/components/inspections/LaboratorioCustomForm';\nimport BotiquinesCustomForm from '@/components/inspections/BotiquinesCustomForm';`
    );
    
    c = c.replace(
        /if \(moduleName\.toLowerCase\(\)\.includes\('laboratorio'\)\) \{\n\s*return <LaboratorioCustomForm SignaturePad=\{SignaturePad\} \/>;\n\s*\}/g,
        `if (moduleName.toLowerCase().includes('laboratorio')) {\n        return <LaboratorioCustomForm SignaturePad={SignaturePad} />;\n    }\n    if (moduleName.toLowerCase().includes('botiquin') || moduleName.toLowerCase().includes('botiquín')) {\n        return <BotiquinesCustomForm SignaturePad={SignaturePad} />;\n    }`
    );
    
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log("Patched router for Botiquines");
}
