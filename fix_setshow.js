const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');
code = code.replace(/setShowDigitalMenu\(true\)/g, "setViewMode('digital')");
code = code.replace(/setShowDigitalMenu\(false\)/g, "setViewMode('menu')");
fs.writeFileSync('app/inspections/page.tsx', code);
console.log('Fixed setShowDigitalMenu references');
