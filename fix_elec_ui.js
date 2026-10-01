const fs = require('fs');
let c = fs.readFileSync('components/inspections/InstalacionesElectricasCustomForm.tsx', 'utf8');

c = c.replace('Ubicación de InstalacionesElectricas', 'Área específica de inspección');
c = c.replace(/'Almacenes'/g, "'Instalaciones Eléctricas'");

fs.writeFileSync('components/inspections/InstalacionesElectricasCustomForm.tsx', c);
console.log('Fixed headers in UI');
