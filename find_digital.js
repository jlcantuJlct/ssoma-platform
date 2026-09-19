const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');
const lines = code.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("viewMode ===")) console.log(i + ': ' + lines[i]);
}
