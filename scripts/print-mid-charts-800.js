const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(`Printing lines 850 to 900:`);
for (let i = 849; i < Math.min(lines.length, 900); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
