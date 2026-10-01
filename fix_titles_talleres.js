const fs = require('fs');
let c = fs.readFileSync('components/inspections/TalleresCustomForm.tsx', 'utf8');

c = c.replace(/category: 'Talleres Mecánico/g, "title: 'Talleres Mecánico");

fs.writeFileSync('components/inspections/TalleresCustomForm.tsx', c);
console.log('Fixed section titles in Talleres form');
