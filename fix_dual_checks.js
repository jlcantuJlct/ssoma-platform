const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const checkmarksRegex = /\/\/ If item was NC or X but got levantado, mark as OK in Excel[\s\S]*?(?=\/\/ Write X to the appropriate column)/;

const rep = `// If item was NC or X but got levantado, mark as OK in Excel (but also keep the NC mark!)
                            let isLevantado = false;
                            if ((val === 'NC' || val === 'X') && checkIsLevantado(matchKey)) {
                                isLevantado = true;
                            }
                            `;

c = c.replace(checkmarksRegex, rep);

const target2 = `if (val === 'OK' || val === 'C') worksheet.getCell(rowNum, 11).value = 'x';`;
const rep2 = `if (val === 'OK' || val === 'C' || isLevantado) worksheet.getCell(rowNum, 11).value = 'x';`;

c = c.replace(target2, rep2);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed dual checkmarks logic');
