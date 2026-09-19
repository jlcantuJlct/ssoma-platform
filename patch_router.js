const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The file definitely has MachineryCustomForm router logic somewhere.
// Let's just find `if (moduleName.toLowerCase().includes('botiquin'))`
// and insert our block right before it.

if (!code.includes("includes('internas')")) {
    const target = "if (moduleName.toLowerCase().includes('botiquin')) {";
    const insertion = `if (moduleName.toLowerCase().includes('internas')) {
        return <InternasCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }
    
    `;
    
    code = code.replace(target, insertion + target);
    fs.writeFileSync(path, code);
    console.log("Injected Internas router perfectly!");
} else {
    console.log("Already has it.");
}
