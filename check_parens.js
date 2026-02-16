const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\components\\dashboard\\DashboardCharts.tsx', 'utf8');

let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '(') open++;
        if (char === ')') open--;
    }
}
console.log('Final paren balance:', open);
