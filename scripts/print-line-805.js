const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');
const line = lines[804]; // 805 is index 804
console.log(`Line 805 content: "${line}"`);
for (let i = 0; i < line.length; i++) {
    console.log(`${i}: ${line[i]} (code: ${line.charCodeAt(i)})`);
}
