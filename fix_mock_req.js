const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /const firmas = data\.firmas \|\| \{\};/g,
    'const firmas = data.firmas || meta.firmas || {};'
);
c = c.replace(
    /const checklist = data\.checklist \|\| \{\};/g,
    'const checklist = data.checklist || data.template || {};'
);
c = c.replace(
    /const observaciones = data\.observaciones \|\| "";/g,
    'const observaciones = data.observaciones || meta.observaciones || "";'
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed meta parsing for levantamientos mock request');
