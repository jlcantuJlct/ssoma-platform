
const fs = require('fs');
const content = fs.readFileSync('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx', 'utf-8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;

    if (braces < 0) {
        console.log(`Brace underflow at char ${i}`);
        console.log(content.substring(Math.max(0, i - 100), Math.min(content.length, i + 100)));
        braces = 0;
    }
}

console.log(`Final counts: braces=${braces}, parens=${parens}, brackets=${brackets}`);
