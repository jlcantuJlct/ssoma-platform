const fs = require('fs');
let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');

c = c.replace(
    /<h1 className="text-2xl font-black mb-1 text-emerald-400">Inspección de InstalacionesElectricas<\/h1>/g,
    '<h1 className="text-2xl font-black mb-1 text-emerald-400">INSPECCIÓN DE COCINA Y COMEDOR</h1>'
);

c = c.replace(
    /F-SIG-043/g, // Assuming F-SIG-043 might be in there
    'F-SIG-074'
);

fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
console.log("Fixed UI header");
