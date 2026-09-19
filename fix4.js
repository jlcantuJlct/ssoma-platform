const fs = require('fs');
const content = fs.readFileSync('app/inspections/page.tsx', 'utf8');
const lines = content.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("viewMode === 'digital'")) {
        for(let j=i; j<=i+40; j++) console.log(j + ': ' + lines[j]);
        break;
    }
}
