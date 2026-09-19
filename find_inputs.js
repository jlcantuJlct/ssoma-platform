const fs = require('fs');
const lines = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
    if ((l.includes('<input ') || l.includes('<textarea ')) && !l.includes('type="file"') && !l.includes('type="date"') && !l.includes('TextInputWithMic')) {
        console.log(i, l);
    }
});
