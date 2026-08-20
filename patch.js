const fs = require('fs');
let f = fs.readFileSync('app/inspections/page.tsx', 'utf8');
f = f.replace(/areas: observedAreas/g, 'areas: [observedArea]');
f = f.replace(/observedAreas\.includes\('Otros'\)/g, "observedArea === 'Otros'");
fs.writeFileSync('app/inspections/page.tsx', f);
