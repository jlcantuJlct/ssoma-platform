const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\components\\dashboard\\DashboardCharts.tsx', 'utf8');
const lines = content.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const [programMonthFilter, setProgramMonthFilter]')) {
        console.log('Found at line ' + (i + 1));
        count++;
    }
}
console.log('Total:', count);
