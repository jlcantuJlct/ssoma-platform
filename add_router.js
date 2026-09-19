const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('InternasCustomForm')) {
    code = code.replace(/import \{ MachineryCustomForm \} from '@\/components\/inspections\/MachineryCustomForm';/, 
        "import { MachineryCustomForm } from '@/components/inspections/MachineryCustomForm';\nimport { InternasCustomForm } from '@/components/inspections/InternasCustomForm';");
    
    code = code.replace(/if \(moduleName\.toLowerCase\(\)\.includes\('maquinaria'\)[\s\S]*?\}/, 
        `if (moduleName.toLowerCase().includes('maquinaria') || moduleName.toLowerCase().includes('máquina') || moduleName.toLowerCase().includes('maquina')) {
        return <MachineryCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }
    if (moduleName.toLowerCase().includes('internas')) {
        return <InternasCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }`);
    fs.writeFileSync(path, code);
    console.log("Routing added!");
} else {
    console.log("Routing already exists.");
}
