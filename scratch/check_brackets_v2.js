
const fs = require('fs');
const content = fs.readFileSync('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx', 'utf-8');

let braces = 0;
let line = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') line++;
    if (char === '{') braces++;
    else if (char === '}') {
        braces--;
        if (braces < 0) {
            console.log(`Brace underflow at line ${line}, char ${i}`);
            console.log(content.substring(Math.max(0, i - 100), Math.min(content.length, i + 100)));
            // Don't reset, let's see how far it goes
        }
    }
}
console.log(`Final braces count: ${braces}`);
