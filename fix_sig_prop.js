const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

c = c.replace(/import SignaturePad from '@\/components\/SignaturePad';\n/, '');
c = c.replace(/export default function AlmacenCustomForm\(\) \{/, 'export default function AlmacenCustomForm({ SignaturePad }: { SignaturePad: any }) {');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Fixed SignaturePad prop');
