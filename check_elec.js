const fs = require('fs');
let c = fs.readFileSync('components/inspections/InstalacionesElectricasCustomForm.tsx', 'utf8');

c = c.replace(/isInstalacionesElectricasMatrix: true/g, 'isInstalacionesElectricasMatrix: true');
// wait, the clone did: c = c.replace(/Campamento/g, 'InstalacionesElectricas');
// So isCampamentoMatrix became isInstalacionesElectricasMatrix!
// Let's verify.
console.log(c.includes('isInstalacionesElectricasMatrix'));
