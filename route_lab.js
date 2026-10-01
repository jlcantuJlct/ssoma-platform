const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('LaboratorioCustomForm')) {
    c = c.replace(
        /import CocinaComedorCustomForm from '@\/components\/inspections\/CocinaComedorCustomForm';/g,
        `import CocinaComedorCustomForm from '@/components/inspections/CocinaComedorCustomForm';\nimport LaboratorioCustomForm from '@/components/inspections/LaboratorioCustomForm';`
    );
    
    c = c.replace(
        /if \(moduleName\.toLowerCase\(\)\.includes\('cocina'\) \|\| moduleName\.toLowerCase\(\)\.includes\('comedor'\)\) \{\n\s*return <CocinaComedorCustomForm SignaturePad=\{SignaturePad\} \/>;\n\s*\}/g,
        `if (moduleName.toLowerCase().includes('cocina') || moduleName.toLowerCase().includes('comedor')) {\n        return <CocinaComedorCustomForm SignaturePad={SignaturePad} />;\n    }\n    if (moduleName.toLowerCase().includes('laboratorio')) {\n        return <LaboratorioCustomForm SignaturePad={SignaturePad} />;\n    }`
    );
    
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log('Added router for Laboratorio');
}
