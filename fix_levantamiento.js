const fs = require('fs');
const p = 'app/api/levantamiento/[token]/route.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
    /const idx = template\.findIndex\(\(t: any\) => \(t\.text \|\| ''\)\.trim\(\) === 'Hallazgos:'\);/g,
    "const idx = Array.isArray(template) ? template.findIndex((t: any) => (t.text || '').trim() === 'Hallazgos:') : -1;"
);

fs.writeFileSync(p, c);
console.log('Fixed findIndex');
