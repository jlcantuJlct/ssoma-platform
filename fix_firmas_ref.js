const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `      else if (isAlmacen || isTalleres || isCampamento) {
          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});`;

const rep = `      else if (isAlmacen || isTalleres || isCampamento) {
          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});
          const firmas = data.firmas || meta.firmas || {};
          const observaciones = data.observaciones || meta.observaciones || "";`;

c = c.replace(target, rep);

// Also remove them from the generic block at the end if they exist
const targetEnd = `          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || data.template || {};
          const observaciones = data.observaciones || meta.observaciones || "";
          const firmas = data.firmas || meta.firmas || {};`;

const repEnd = `          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || data.template || {};`;
          
c = c.replace(targetEnd, repEnd);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed firmas reference in Manejador 5');
