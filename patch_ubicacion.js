const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const start = code.indexOf('else if (isCampamento) {');
const end = code.indexOf('else {', start);
if (start !== -1 && end !== -1) {
    let block = code.substring(start, end);
    block = block.replace(
        "normText.includes('inspeccion')))", 
        "normText.includes('inspeccion')) || normText.includes('ubicacion'))"
    );
    code = code.substring(0, start) + block + code.substring(end);
    fs.writeFileSync(path, code);
    console.log("Patched ubicacion!");
}
