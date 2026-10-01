const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import TalleresCustomForm from '@\/components\/inspections\/TalleresCustomForm';/, "import TalleresCustomForm from '@/components/inspections/TalleresCustomForm';\nimport CampamentoCustomForm from '@/components/inspections/CampamentoCustomForm';");

const routeTarget = `    if (moduleName.toLowerCase().includes('taller')) {
        return <TalleresCustomForm SignaturePad={SignaturePad} />;
    }`;
const routeRep = `    if (moduleName.toLowerCase().includes('taller')) {
        return <TalleresCustomForm SignaturePad={SignaturePad} />;
    }

    if (moduleName.toLowerCase().includes('campamento')) {
        return <CampamentoCustomForm SignaturePad={SignaturePad} />;
    }`;

c = c.replace(routeTarget, routeRep);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Routed Campamento successfully');
