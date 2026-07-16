const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardClient.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

lines.forEach((line, index) => {
    if (line.includes('objectives') || line.includes('objective')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
