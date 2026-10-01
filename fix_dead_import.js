const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import BotiquinesCustomForm from '@\/components\/inspections\/BotiquinesCustomForm';\r?\n?/g, '');

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log("Removed dead import");
