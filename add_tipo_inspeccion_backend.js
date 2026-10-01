const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `            worksheet.getCell("D8").value = meta.responsable || "";`;
const rep = `            worksheet.getCell("D8").value = meta.responsable || "";

            // Tipo de Inspección (Planificada / No Planificada)
            if (meta.tipoInspeccion === 'Planificada') {
                worksheet.getCell("A10").value = "x";
                worksheet.getCell("A10").alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell("A10").font = { bold: true };
            } else if (meta.tipoInspeccion === 'No Planificada') {
                worksheet.getCell("A11").value = "x";
                worksheet.getCell("A11").alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell("A11").font = { bold: true };
            }`;

c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added tipoInspeccion logic to export-excel');
