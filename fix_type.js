const fs = require('fs');
let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');

c = c.replace(/inspectionType: 'Instalaciones Eléctricas'/g, "inspectionType: 'Inspección de Cocina y Comedor'");

fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
console.log("Fixed inspectionType");
