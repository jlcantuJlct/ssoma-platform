const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

code = code.replace(
    'className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"',
    'className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group"'
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched missing group class");
