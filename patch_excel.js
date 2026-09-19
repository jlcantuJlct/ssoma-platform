const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add `if (item.type === 'title') return;` to the Campamento grid loop.
// Let's find the grid loop for Campamento:
// `// Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)`
// `templateDef.forEach((item: any, idx: number) => {`
// `    const origText = item.text || '';`
// Let's just do a replace that matches the Campamento block. Actually, Talleres has this too. I'll add it safely.

const gridLoopRegex = /\/\/ Grid evaluations \(Columns K=Cumple, L=No Cumple, M=N\/A\)\s+templateDef\.forEach\(\(item: any, idx: number\) => \{\s+const origText/g;
const newGridLoop = `// Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)\n                templateDef.forEach((item: any, idx: number) => {\n                    if (item.type === 'title') return;\n                    const origText`;
code = code.replace(gridLoopRegex, newGridLoop);

// 2. Add White Font color to rows 23, 36, 45, 50 for Campamento!
// Let's find the end of `isCampamento` block, near `const buffer = await workbook.xlsx.writeBuffer();`
const endCampamentoRegex = /if \(finalObsText\) \{\s+worksheet\.getCell\('A57'\)\.value = finalObsText;\s+for \(let r = 57; r <= 62; r\+\+\) \{\s+for \(let c = 1; c <= 13; c\+\+\) \{\s+worksheet\.getCell\(r, c\)\.alignment = \{ wrapText: true, vertical: 'top', horizontal: 'left' \};\s+\}\s+\}\s+const lineCount = finalObsText\.split\('\\n'\)\.length;\s+const requiredHeight = lineCount \* 18;\s+if \(requiredHeight > 90\) \{\s+worksheet\.getRow\(57\)\.height = requiredHeight - 75;\s+\}\s+\}/;

const whiteFontLogic = `if (finalObsText) {
                    worksheet.getCell('A57').value = finalObsText;
                    for (let r = 57; r <= 62; r++) {
                        for (let c = 1; c <= 13; c++) {
                            worksheet.getCell(r, c).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                        }
                    }
                    const lineCount = finalObsText.split('\\n').length;
                    const requiredHeight = lineCount * 18;
                    if (requiredHeight > 90) {
                        worksheet.getRow(57).height = requiredHeight - 75;
                    }
                }
                
                // Color títulos en blanco
                [23, 36, 45, 50].forEach(r => {
                    for (let c = 2; c <= 13; c++) {
                        const cell = worksheet.getCell(r, c);
                        if (cell.value) {
                            cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
                        }
                    }
                });`;

code = code.replace(endCampamentoRegex, whiteFontLogic);

fs.writeFileSync(path, code);
console.log("Excel rendering patched!");
