const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import \{ BotiquinCustomForm \} from '@\/components\/inspections\/BotiquinCustomForm';/, `import { BotiquinCustomForm } from '@/components/inspections/BotiquinCustomForm';\nimport AlmacenCustomForm from '@/components/inspections/AlmacenCustomForm';`);

const target = `    if (moduleName.toLowerCase().includes('botiquin')) {
        return <BotiquinCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }`;

const replacement = `    if (moduleName.toLowerCase().includes('botiquin')) {
        return <BotiquinCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }

    if (moduleName.toLowerCase().includes('almac')) {
        return <AlmacenCustomForm />;
    }`;

c = c.replace(target, replacement);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Successfully registered AlmacenCustomForm cleanly');
