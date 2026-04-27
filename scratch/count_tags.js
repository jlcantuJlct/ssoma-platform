
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\components\\dashboard\\DashboardCharts.tsx', 'utf8');

let divOpen = 0;
let divClose = 0;
let parenOpen = 0;
let parenClose = 0;

for (let i = 0; i < content.length; i++) {
    if (content.substring(i, i + 4) === '<div') divOpen++;
    if (content.substring(i, i + 6) === '</div') divClose++;
    if (content[i] === '(') parenOpen++;
    if (content[i] === ')') parenClose++;
}

console.log(`Divs: Open ${divOpen}, Close ${divClose}`);
console.log(`Parens: Open ${parenOpen}, Close ${parenClose}`);
