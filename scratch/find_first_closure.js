
const fs = require('fs');
const content = fs.readFileSync('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx', 'utf-8');

let braces = 0;
let line = 1;
let componentStarted = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') line++;
    if (char === '{') {
        braces++;
        if (line === 43) componentStarted = true;
    }
    else if (char === '}') {
        braces--;
        if (componentStarted && braces === 0) {
            console.log(`FIRST Early closure at line ${line}`);
            console.log(content.substring(Math.max(0, i - 200), Math.min(content.length, i + 200)));
            process.exit(0);
        }
    }
}
