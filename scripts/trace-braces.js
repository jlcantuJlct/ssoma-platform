const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let blockComment = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const next = line[j+1] || '';

        // Handle comments
        if (inComment) {
            continue; 
        }
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

        // Handle string literals
        if (inString) {
            if (char === stringChar && line[j-1] !== '\\') {
                inString = false;
            }
            continue;
        }
        if ((char === '"' || char === "'" || char === '`') && line[j-1] !== '\\') {
            inString = true;
            stringChar = char;
            continue;
        }

        // Count braces
        if (char === '{') {
            stack.push({ line: i + 1, col: j + 1, text: line.trim() });
        } else if (char === '}') {
            if (stack.length > 0) {
                stack.pop();
            }
        }
    }
    inComment = false;
}

console.log("=== STACK AT END ===");
stack.forEach((item, idx) => {
    console.log(`${idx + 1}: Line ${item.line}, col ${item.col}: ${item.text}`);
});
