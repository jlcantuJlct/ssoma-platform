const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Restore to clean state just in case it had any of my duplicated garbage
if (!code.includes('InternasCustomForm')) {
    code = code.replace(/import \{ MachineryCustomForm \} from '@\/components\/inspections\/MachineryCustomForm';/, 
        "import { MachineryCustomForm } from '@/components/inspections/MachineryCustomForm';\nimport { InternasCustomForm } from '@/components/inspections/InternasCustomForm';");
    
    const targetBlock = `    if (moduleName.toLowerCase().includes('maquinaria') || moduleName.toLowerCase().includes('máquina') || moduleName.toLowerCase().includes('maquina')) {
        return <MachineryCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }`;
    const newBlock = `    if (moduleName.toLowerCase().includes('maquinaria') || moduleName.toLowerCase().includes('máquina') || moduleName.toLowerCase().includes('maquina')) {
        return <MachineryCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }
    if (moduleName.toLowerCase().includes('internas')) {
        return <InternasCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }`;
    
    code = code.replace(targetBlock, newBlock);
    fs.writeFileSync(path, code);
    console.log("Router fixed safely!");
}
