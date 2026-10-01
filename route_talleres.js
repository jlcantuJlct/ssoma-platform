const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import AlmacenCustomForm from '@\/components\/inspections\/AlmacenCustomForm';/, "import AlmacenCustomForm from '@/components/inspections/AlmacenCustomForm';\nimport TalleresCustomForm from '@/components/inspections/TalleresCustomForm';");

const routeTarget = `    if (moduleName.toLowerCase().includes('almac')) {
        return <AlmacenCustomForm SignaturePad={SignaturePad} />;
    }`;
const routeRep = `    if (moduleName.toLowerCase().includes('almac')) {
        return <AlmacenCustomForm SignaturePad={SignaturePad} />;
    }

    if (moduleName.toLowerCase().includes('taller')) {
        return <TalleresCustomForm SignaturePad={SignaturePad} />;
    }`;

c = c.replace(routeTarget, routeRep);
fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Routed Talleres successfully');
