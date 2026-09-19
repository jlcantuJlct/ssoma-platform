const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `const getAns = (label) => answers.find(a => a.text === label)?.text || '';`;
const replacement = `const getAns = (label) => {
                const idx = (template || []).findIndex(t => t.text === label);
                return idx !== -1 ? (answers[idx]?.text || answers[idx]?.signature || '') : '';
            };`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(path, code);
    console.log("Fixed getAns!");
} else {
    console.log("Could not find getAns string to replace.");
}
