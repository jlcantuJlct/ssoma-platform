const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(`Total lines: ${lines.length}`);
const start = Math.max(0, lines.length - 100);
for (let i = start; i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
