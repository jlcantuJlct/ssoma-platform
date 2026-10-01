const fs = require('fs');
let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');
const match = c.match(/const template = \[\s*[\s\S]*?\s*\];/m);
if (match) {
    console.log(match[0].substring(0, 500));
} else {
    console.log("No match");
}
