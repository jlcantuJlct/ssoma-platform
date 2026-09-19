const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to insert `const matchedRows = new Set<number>();` right before the `templateDef.forEach` grid evaluation loop.
// For BOTH isTalleres and isCampamento!
// Let's replace `// Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)`
// With `// Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)\n                const matchedRows = new Set<number>();`

const oldGridLoop = /\/\/ Grid evaluations \(Columns K=Cumple, L=No Cumple, M=N\/A\)\s+templateDef\.forEach\(\(item: any, idx: number\) => \{/g;
const newGridLoop = `// Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)\n                const matchedRows = new Set<number>();\n                templateDef.forEach((item: any, idx: number) => {`;
code = code.replace(oldGridLoop, newGridLoop);

// And inside the loop, we must check `!matchedRows.has(r)` and if matched, `matchedRows.add(targetRow);`.
// `if (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean)))) {`
// Let's replace it with:
// `if (!matchedRows.has(r) && (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean))))) {`

const oldCondition = /if \(bClean === tClean \|\| \(bClean\.length > 20 && \(tClean\.includes\(bClean\) \|\| bClean\.includes\(tClean\)\)\)\) \{/g;
const newCondition = `if (!matchedRows.has(r) && (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean))))) {`;
code = code.replace(oldCondition, newCondition);

// And after `targetRow = r; break;`, we need to add to matchedRows, BUT it's inside the r loop, so let's do it after the r loop.
// `if (targetRow !== -1) {`
// We replace with:
// `if (targetRow !== -1) {\n                        matchedRows.add(targetRow);`

const oldTargetIf = /if \(targetRow !== -1\) \{/g;
const newTargetIf = `if (targetRow !== -1) {\n                        matchedRows.add(targetRow);`;
code = code.replace(oldTargetIf, newTargetIf);

fs.writeFileSync(path, code);
console.log("Fixed duplicate question matching!");
