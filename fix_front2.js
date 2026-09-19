const fs = require('fs');
const c = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');
const lines = c.split('\\n'); // If it has literal \n, this will split it!
// Let's actually check how many lines it has when splitting by normal newline vs literal \n
if (lines.length > 100) {
    fs.writeFileSync('components/inspections/InternasCustomForm.tsx', lines.join('\n'));
} else {
    // maybe it split normally?
}
