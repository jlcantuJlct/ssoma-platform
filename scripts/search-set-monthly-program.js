const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'app', 'inspections', 'page.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

lines.forEach((line, idx) => {
    if (line.includes('setMonthlyProgram')) {
        console.log(`Line ${idx+1}: ${line.trim()}`);
    }
});
