const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace the greedy includes with strict or longer includes
const badMatch = /if \(bClean\.length > 5 && \(tClean\.includes\(bClean\) \|\| bClean\.includes\(tClean\)\)\) \{/g;
const newMatch = `if (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean)))) {`;

code = code.replace(badMatch, newMatch);
fs.writeFileSync(path, code);
console.log("Fixed greedy row matching!");
