const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\app\\brigadistas\\page.tsx', 'utf8');
let openBraces = 0;
let closeBraces = 0;
let openParens = 0;
let closeParens = 0;

for (let char of content) {
    if (char === '{') openBraces++;
    if (char === '}') closeBraces++;
    if (char === '(') openParens++;
    if (char === ')') closeParens++;
}

console.log(`Braces: { ${openBraces}, } ${closeBraces} (Diff: ${openBraces - closeBraces})`);
console.log(`Parens: ( ${openParens}, ) ${closeParens} (Diff: ${openParens - closeParens})`);
