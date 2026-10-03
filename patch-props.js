const fs = require('fs');
let code = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

code = code.replace(
    /return <EstacionEmergenciaCustomForm moduleName=\{moduleName\} version=\{version\} SignaturePad=\{SignaturePad\} \/>;/g,
    'return <EstacionEmergenciaCustomForm SignaturePad={SignaturePad} />;'
);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', code);
