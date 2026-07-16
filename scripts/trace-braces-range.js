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
    const lineNum = i + 1;
    const isTargetRange = (lineNum >= 740 && lineNum <= 910);

    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const next = line[j+1] || '';

        // Handle comments
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
            stack.push({ line: lineNum, col: j + 1 });
            if (isTargetRange) {
                console.log(`[PUSH] Line ${lineNum}, col ${j + 1}: ${line.trim()} (Stack size: ${stack.length})`);
            }
        } else if (char === '}') {
            const popped = stack.pop();
            if (isTargetRange) {
                console.log(`[POP] Line ${lineNum}, col ${j + 1}: ${line.trim()} -> Popped open brace from line ${popped ? popped.line : 'NONE'} (Stack size: ${stack.length})`);
            }
        }
    }
    inComment = false;
}
