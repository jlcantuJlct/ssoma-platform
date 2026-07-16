const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(`Printing lines 2480 to 2530:`);
for (let i = 2479; i < Math.min(lines.length, 2530); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
