const fs = require('fs');
let c = fs.readFileSync('components/inspections/CampamentoCustomForm.tsx', 'utf8');

c = c.replace(/category:/g, 'title:');

fs.writeFileSync('components/inspections/CampamentoCustomForm.tsx', c);
console.log('Fixed section titles in Campamento form');
