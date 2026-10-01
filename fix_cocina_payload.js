const fs = require('fs');
let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');

c = c.replace(/isInstalacionesElectricasMatrix: true/g, 'isCocinaComedorMatrix: true');
c = c.replace(/moduleName: "InstalacionesElectricas"/g, 'moduleName: "Cocina y Comedor"');
c = c.replace(/moduleName: 'InstalacionesElectricas'/g, 'moduleName: "Cocina y Comedor"');

fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
console.log('Fixed payload parameters for Cocina y Comedor');
