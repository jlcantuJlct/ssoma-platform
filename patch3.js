const fs = require('fs');
let file = fs.readFileSync('app/inspections/page.tsx', 'utf8');

const oldArray = '["Equipos", "Almacén", "Mantenimiento Rutinario", "Mantenimiento Periódico", "PAD San Clemente", "Chancadora", "DME", "SSTMA", "Prevención SSOMA", "Señalización", "Otros"]';
const newArray = '["Equipos", "Almacén", "Mantenimiento Rutinario", "Mantenimiento Periódico", "Señalización", "Movimiento de Tierras", "Obras de Arte", "Administración", "SSTMA", "Otros"]';

file = file.replace(oldArray, newArray);
fs.writeFileSync('app/inspections/page.tsx', file);
