const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const startLab = code.indexOf('else if (isLaboratorio)');
const endLab = code.indexOf('else if (isElectricas)');

let block = code.substring(startLab, endLab);

// Fix signatures for Laboratorio
// Inspector signature goes to K6 (tl: {col: 10, row: 5})
block = block.replace(/tl: \{ col: 10, row: 6 \}/g, 'tl: { col: 10, row: 5 }');

// Responsable signature goes to K8 (tl: {col: 10, row: 7})
// Wait, the replace above might not have changed Responsable if it was row 7 already.
// Wait! isElectricas had Inspector at row 6, Responsable at row 7.
// In Laboratorio:
// Inspector is at row 5.
// Responsable is at row 7.
// I will just explicitly patch both.
block = block.replace(/if \(firmaResponsable\) \{[\s\S]*?tl: \{ col: 10, row: 7 \}/, 
    'if (firmaResponsable) {\n                    try {\n                        const base64Data = firmaResponsable.replace(/^data:image\\/\\w+;base64,/, "");\n                        const imageId = workbook.addImage({ base64: base64Data, extension: \'png\' });\n                        worksheet.addImage(imageId, { tl: { col: 10, row: 7 }');

fs.writeFileSync(path, code.substring(0, startLab) + block + code.substring(endLab));
console.log("Fixed signatures for Laboratorio!");
