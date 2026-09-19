const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('InternasCustomForm')) {
    code = code.replace(
        "import { BotiquinCustomForm } from '@/components/inspections/BotiquinCustomForm';",
        "import { BotiquinCustomForm } from '@/components/inspections/BotiquinCustomForm';\nimport { InternasCustomForm } from '@/components/inspections/InternasCustomForm';"
    );

    code = code.replace(
        "if (moduleName.toLowerCase().includes('botiquin')) {",
        "if (moduleName.toLowerCase().includes('internas')) {\n        return <InternasCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;\n    }\n\n    if (moduleName.toLowerCase().includes('botiquin')) {"
    );

    fs.writeFileSync(path, code);
    console.log("Re-added InternasCustomForm routing!");
} else {
    console.log("Already has InternasCustomForm!");
}
