const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `const checklist = data.checklist || {};
          const observaciones = data.observaciones || "";
          const firmas = data.firmas || {};`;

const replacement = `const checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});
          const observaciones = data.observaciones || meta.observaciones || "";
          const firmas = data.firmas || meta.firmas || {};
          if (meta.fotosDefectos && !data.fotosDefectos) data.fotosDefectos = meta.fotosDefectos;`;

c = c.replace(target, replacement);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export-excel mapping');
