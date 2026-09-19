const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const idx1 = code.indexOf('else if (isInternas) {');
let idx2 = idx1 - 1;
while(idx2 >= 0 && code[idx2] !== '}') {
    idx2--;
}

if(idx2 > 0 && code[idx2] === '}') {
    code = code.substring(0, idx2) + code.substring(idx2 + 1);
    fs.writeFileSync(path, code);
    console.log("Deleted the offending bracket manually by index!");
} else {
    console.log("Could not find bracket to delete.");
}
