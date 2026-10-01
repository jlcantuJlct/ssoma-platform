const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const targetEnd = `          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || data.template || {};

          if (fs.existsSync(templatePath)) {`;

const repEnd = `          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || data.template || {};
          const observaciones = data.observaciones || meta.observaciones || "";
          const firmas = data.firmas || meta.firmas || {};

          if (fs.existsSync(templatePath)) {`;

c = c.replace(targetEnd, repEnd);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Restored generic variables');
