const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\components\\dashboard\\DashboardCharts.tsx', 'utf8');

let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '(') open++;
        if (char === ')') open--;
    }
}
console.log('Balance:', open);

// Find where it goes wrong (heuristic: if it stays unclosed for too long)
// Actually, let's just create a list of open locations and match them.
let stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '(') stack.push({ line: i + 1, char: j });
        if (char === ')') {
            if (stack.length > 0) stack.pop();
            else console.log('Extra ) at line ' + (i + 1));
        }
    }
}
if (stack.length > 0) {
    console.log('Unclosed ( at line ' + stack[0].line + ' char ' + stack[0].char);
    if (stack.length > 1) console.log('...and ' + (stack.length - 1) + ' more.');
    // Print the last one too
    const last = stack[stack.length - 1];
    console.log('Last unclosed ( at line ' + last.line + ' char ' + last.char);
}
