const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinesCustomForm.tsx', 'utf8');

c = c.replace(
    /\{renderMicInput\("Área específica de inspección", "area", meta\.area\)\}/g,
    `{renderMicInput("Ubicación del Botiquín", "ubicacion", meta.ubicacion)}`
);

c = c.replace(
    /meta\.area/g,
    `meta.ubicacion`
);

c = c.replace(
    /area: meta\.ubicacion \|\| 'Inspección Digital'/g,
    `area: meta.proyecto || 'Inspección Digital', ubicacion: meta.ubicacion || ''`
);

fs.writeFileSync('components/inspections/BotiquinesCustomForm.tsx', c);
console.log("Updated inputs in BotiquinesCustomForm");
