const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const targetBajo = `if (h.riesgo === 'Bajo') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFc6efce' } };`;
const targetMedio = `if (h.riesgo === 'Medio') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffeb9c' } };`;
const targetAlto = `if (h.riesgo === 'Alto') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffc7ce' } };`;
const targetAbierto = `if (h.estado === 'Abierto') worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffc7ce' } };`;
const targetCerrado = `if (h.estado === 'Cerrado') worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFc6efce' } };`;

const repBajo = `if (h.riesgo === 'Bajo') {
                    const c = worksheet.getCell(\`J\${currentRow}\`);
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
                    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                }`;
const repMedio = `if (h.riesgo === 'Medio') {
                    const c = worksheet.getCell(\`J\${currentRow}\`);
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
                    c.font = { color: { argb: 'FF000000' }, bold: true };
                }`;
const repAlto = `if (h.riesgo === 'Alto') {
                    const c = worksheet.getCell(\`J\${currentRow}\`);
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                }`;
const repAbierto = `if (h.estado === 'Abierto') {
                    const c = worksheet.getCell(\`U\${currentRow}\`);
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                }`;
const repCerrado = `if (h.estado === 'Cerrado') {
                    const c = worksheet.getCell(\`U\${currentRow}\`);
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
                    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                }`;

code = code.replace(targetBajo, repBajo);
code = code.replace(targetMedio, repMedio);
code = code.replace(targetAlto, repAlto);
code = code.replace(targetAbierto, repAbierto);
code = code.replace(targetCerrado, repCerrado);

fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('Updated Excel Colors!');
