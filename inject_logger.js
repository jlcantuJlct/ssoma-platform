const fs = require('fs');
let c = fs.readFileSync('app/actions.ts', 'utf8');

c = c.replace(
    /return \{ success: false, error: e\.message \|\| String\(e\) \};/g,
    `fs.writeFileSync('C:/Users/jlcan/Desktop/error.txt', "GETINSPECTIONS ERR: " + String(e) + " \\n" + (e.stack||""));\n        return { success: false, error: e.message || String(e) };`
);

fs.writeFileSync('app/actions.ts', c);
console.log('Injected error logger');
