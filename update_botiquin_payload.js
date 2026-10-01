const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinCustomForm.tsx', 'utf8');

c = c.replace(
    /saveToDrive: true,/g,
    `saveToDrive: true,
                    meta: { proyecto, fecha, hora, inspector, cargo, responsable, ubicacion, tipoInspeccion },
                    firmas: { inspectorFirma: inspectorSignature, responsableFirma: responsableSignature },
                    checklist: items.reduce((acc, item) => ({ ...acc, [item.name]: item.eval }), {}),`
);

fs.writeFileSync('components/inspections/BotiquinCustomForm.tsx', c);
console.log("Updated BotiquinCustomForm payload for Manejador 5");
