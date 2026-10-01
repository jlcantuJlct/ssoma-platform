const fs = require('fs');

let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /else if \(isBotiquin\) \{ for\(let r=35; r<=42; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \}/,
    `else if (isBotiquin) { for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); }`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Fixed unmerge loop for Botiquin");
