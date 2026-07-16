const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components', 'dashboard', 'DashboardCharts.tsx');
const content = fs.readFileSync(file, 'utf8');

function checkRobustBraces(content) {
    let stack = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let blockComment = false;
    let templateLevel = 0; // to track `${` inside backticks
    let templateStack = []; // stores whether we were in string and the stringChar
    
    let lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const next = line[j+1] || '';
            
            if (inComment) {
                // Line comments end at the end of the line, which is handled at the end of the line loop
                continue;
            }
            if (blockComment) {
                if (char === '*' && next === '/') {
                    blockComment = false;
                    j++;
                }
                continue;
            }
            
            // If we are not in a string, we can start comments
            if (!inString) {
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
            }
            
            // Handle strings
            if (inString) {
                // Handle template literal expressions
                if (stringChar === '`' && char === '$' && next === '{') {
                    // We are entering an expression inside a template literal
                    templateStack.push({ inString, stringChar });
                    inString = false;
                    stringChar = '';
                    stack.push({ line: lineNum, col: j + 2, type: 'template_expr', display: '${' });
                    j++;
                    continue;
                }
                
                if (char === stringChar && line[j-1] !== '\\') {
                    inString = false;
                    stringChar = '';
                }
                continue;
            }
            
            // If we are not in a string or comment, we process code
            if (char === '"' || char === "'" || char === '`') {
                inString = true;
                stringChar = char;
                continue;
            }
            
            // Process braces
            if (char === '{') {
                stack.push({ line: lineNum, col: j + 1, type: 'brace', display: '{' });
            } else if (char === '}') {
                if (stack.length === 0) {
                    console.log(`Extra } at line ${lineNum}, col ${j + 1}`);
                    continue;
                }
                const top = stack.pop();
                if (top.type === 'template_expr') {
                    // We are closing a template expression, restore string state
                    const restored = templateStack.pop();
                    inString = restored.inString;
                    stringChar = restored.stringChar;
                }
            } else if (char === '(') {
                stack.push({ line: lineNum, col: j + 1, type: 'paren', display: '(' });
            } else if (char === ')') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'paren') {
                    stack.pop();
                } else {
                    console.log(`Extra ) or mismatched at line ${lineNum}, col ${j + 1}`);
                }
            } else if (char === '[') {
                stack.push({ line: lineNum, col: j + 1, type: 'bracket', display: '[' });
            } else if (char === ']') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'bracket') {
                    stack.pop();
                } else {
                    console.log(`Extra ] or mismatched at line ${lineNum}, col ${j + 1}`);
                }
            }
        }
        inComment = false; // Reset line comment at end of line
    }
    
    console.log(`\n=== ROBUST CHECK RESULTS ===`);
    if (stack.length === 0) {
        console.log("✅ All brackets, parentheses, curly braces, and template expressions are perfectly balanced!");
    } else {
        console.log(`Unbalanced items count: ${stack.length}`);
        stack.forEach((item, idx) => {
            console.log(`${idx + 1}: Unclosed ${item.display} at line ${item.line}, col ${item.col} - line snippet: "${lines[item.line-1].trim()}"`);
        });
    }
}

checkRobustBraces(content);
