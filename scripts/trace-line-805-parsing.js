const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const line = lines[804]; // line 805
let inString = false;
let stringChar = '';

console.log("Tracing line 805 character-by-character:");
for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (inString) {
        console.log(`Char ${j} ('${char}', code: ${char.charCodeAt(0)}): inside string (char === stringChar: ${char === stringChar})`);
        if (char === stringChar && line[j-1] !== '\\') {
            inString = false;
            console.log(`  -> STRING END at char ${j}`);
        }
    } else {
        if ((char === '"' || char === "'" || char === '`') && line[j-1] !== '\\') {
            inString = true;
            stringChar = char;
            console.log(`Char ${j} ('${char}', code: ${char.charCodeAt(0)}): STRING START`);
        }
    }
}
