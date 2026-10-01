const fs = require('fs');

let c = fs.readFileSync('components/inspections/BotiquinCustomForm.tsx', 'utf8');

c = c.replace(
    /a\.download = `Inspeccion_Almacen_\$\{meta\.fecha\}_\$\{Date\.now\(\)\}\.xlsx`;/g,
    `a.download = \`Inspeccion_Botiquines_\${meta.fecha}_\${Date.now()}.xlsx\`;`
);

fs.writeFileSync('components/inspections/BotiquinCustomForm.tsx', c);
console.log("Fixed download file name");
