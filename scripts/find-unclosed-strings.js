const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

let inString = false;
let stringChar = '';
let inComment = false;
let blockComment = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const next = line[j+1] || '';

        if (inComment) continue;
        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                j++;
            }
            continue;
        }
        if (char === '/' && next === '/') {
            inComment = true;
            j++;
            continue;
        }
        if (char === '/' && next === '*') {
            blockComment = true;
            j++;
            continue;
        }

        if (inString) {
            if (char === stringChar && line[j-1] !== '\\') {
                inString = false;
                if (lineNum >= 700 && lineNum <= 820) {
                    console.log(`[STRING END] Line ${lineNum}, col ${j+1}: character ${char}`);
                }
            }
            continue;
        }

        if ((char === '"' || char === "'" || char === '`') && line[j-1] !== '\\') {
            inString = true;
            stringChar = char;
            if (lineNum >= 700 && lineNum <= 820) {
                console.log(`[STRING START] Line ${lineNum}, col ${j+1}: character ${char}`);
            }
        }
    }
    inComment = false;
}
