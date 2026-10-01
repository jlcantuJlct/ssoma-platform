const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/return <AlmacenCustomForm \/>;/, 'return <AlmacenCustomForm SignaturePad={SignaturePad} />;');

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Fixed SignaturePad passed from page.tsx');
