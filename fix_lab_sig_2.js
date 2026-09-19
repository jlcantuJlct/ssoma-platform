const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const startLab = code.indexOf('else if (isLaboratorio)');
const endLab = code.indexOf('else if (isElectricas)');

let block = code.substring(startLab, endLab);

// Change Inspector signature from row 5 (K6) to row 6 (K7)
block = block.replace(/if \(firmaInspector\) \{[\s\S]*?tl: \{ col: 10, row: 5 \}/, 
    'if (firmaInspector) {\n                    try {\n                        const base64Data = firmaInspector.replace(/^data:image\\/\\w+;base64,/, "");\n                        const imageId = workbook.addImage({ base64: base64Data, extension: \'png\' });\n                        worksheet.addImage(imageId, { tl: { col: 10, row: 6 }');

// Make sure Responsable is at row 7 (K8) (it already is, but just in case)
block = block.replace(/if \(firmaResponsable\) \{[\s\S]*?tl: \{ col: 10, row: \d+ \}/, 
    'if (firmaResponsable) {\n                    try {\n                        const base64Data = firmaResponsable.replace(/^data:image\\/\\w+;base64,/, "");\n                        const imageId = workbook.addImage({ base64: base64Data, extension: \'png\' });\n                        worksheet.addImage(imageId, { tl: { col: 10, row: 7 }');

fs.writeFileSync(path, code.substring(0, startLab) + block + code.substring(endLab));
console.log("Fixed Inspector signature to row 7 (K7)!");
