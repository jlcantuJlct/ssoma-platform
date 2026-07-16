const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const content = fs.readFileSync(file, 'utf8');

if (content.includes('\u001b') || content.includes('[33m')) {
    console.log("File contains ANSI escape characters!");
} else {
    console.log("No ANSI characters found in the source content.");
}

// Let's search for "div" or incorrect JSX syntax around line 2500 to 2515
const lines = content.split('\n');
console.log("Around 2500-2515 in file:");
for (let i = 2495; i < 2515; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
