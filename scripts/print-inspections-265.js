const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'app', 'inspections', 'page.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 264; i < Math.min(lines.length, 305); i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
