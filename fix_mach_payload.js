const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(
    /answers: meta,(\s+)inspectionRecordId/g,
    "answers: { ...meta, observaciones, firmas, fotosDefectos },$1inspectionRecordId"
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed levantamiento payload in form');
