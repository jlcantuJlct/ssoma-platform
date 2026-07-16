const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(`Printing lines 740 to 860:`);
for (let i = 739; i < Math.min(lines.length, 860); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
