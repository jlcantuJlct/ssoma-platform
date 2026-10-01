const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

const startIdx = c.indexOf("const escapeRegex = (s) =>");
const endIdx = c.indexOf("const regex = new RegExp");

if (startIdx !== -1 && endIdx !== -1) {
    c = c.substring(0, startIdx) + "const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n            " + c.substring(endIdx);
    fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
    console.log("Fixed it via slice");
}
