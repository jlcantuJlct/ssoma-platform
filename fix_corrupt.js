const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace the hallazgos loop and offset logic
const oldLoop = `            let currentRow = 15;
            hallazgos.forEach((h, idx) => {
                if (idx > 0) {
                    worksheet.duplicateRow(currentRow, 1, true);
                    currentRow++;
                }
                
                worksheet.getCell(\`A\${currentRow}\`).value = idx + 1;
                worksheet.getCell(\`B\${currentRow}\`).value = h.descripcion || '';
                
                if (h.riesgo === 'Bajo') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Bajo';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else if (h.riesgo === 'Medio') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Medio';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAB308' } };
                } else if (h.riesgo === 'Alto') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Alto';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                worksheet.getCell(\`K\${currentRow}\`).value = h.categoria || '';
                worksheet.getCell(\`L\${currentRow}\`).value = h.accion || '';
                worksheet.getCell(\`N\${currentRow}\`).value = h.responsable || '';
                worksheet.getCell(\`P\${currentRow}\`).value = h.fecha || '';
                
                if (h.estado === 'Cerrado') {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Cerrado';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Abierto';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                
                if (h.evidenciaLevantamiento) {
                    try {
                        const base64Data = h.evidenciaLevantamiento.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // 16 is Q (0-indexed col internally? No, tl uses 0-indexed coords)
                        // A=0, B=1, ..., G=6, P=15, Q=16, U=20
                        worksheet.addImage(imageId, { tl: { col: 16, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
            });

            const offset = Math.max(0, hallazgos.length - 1);
            
            worksheet.getCell(\`A\${23 + offset}\`).value = conclusiones || '';
            worksheet.getCell(\`A\${26 + offset}\`).value = regNombre || '';
            worksheet.getCell(\`M\${26 + offset}\`).value = regCargo || '';
            worksheet.getCell(\`P\${26 + offset}\`).value = regFecha || '';
            
            if (regFirma) {
                try {
                    const base64Data = regFirma.replace(/^data:image\\/\\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 19, row: 24 + offset }, ext: { width: 180, height: 60 } });
                } catch(e) {}
            }`;

const newLoop = `            hallazgos.forEach((h, idx) => {
                const currentRow = 15 + idx;
                if (currentRow > 21) return; // Template only supports up to 7 findings without dynamic rows

                worksheet.getCell(\`A\${currentRow}\`).value = idx + 1;
                worksheet.getCell(\`B\${currentRow}\`).value = h.descripcion || '';
                
                if (h.riesgo === 'Bajo') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Bajo';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else if (h.riesgo === 'Medio') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Medio';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAB308' } };
                } else if (h.riesgo === 'Alto') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Alto';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                worksheet.getCell(\`K\${currentRow}\`).value = h.categoria || '';
                worksheet.getCell(\`L\${currentRow}\`).value = h.accion || '';
                worksheet.getCell(\`N\${currentRow}\`).value = h.responsable || '';
                worksheet.getCell(\`P\${currentRow}\`).value = h.fecha || '';
                
                if (h.estado === 'Cerrado') {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Cerrado';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Abierto';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                
                if (h.evidenciaLevantamiento) {
                    try {
                        const base64Data = h.evidenciaLevantamiento.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 16, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
            });

            worksheet.getCell('A23').value = conclusiones || '';
            worksheet.getCell('A26').value = regNombre || '';
            worksheet.getCell('M26').value = regCargo || '';
            worksheet.getCell('P26').value = regFecha || '';
            
            if (regFirma) {
                try {
                    const base64Data = regFirma.replace(/^data:image\\/\\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 19, row: 24 }, ext: { width: 180, height: 60 } });
                } catch(e) {}
            }`;

if (code.includes(oldLoop.trim().substring(0, 50))) {
    // Basic replace using string indexOf
    const startIdx = code.indexOf('            let currentRow = 15;');
    const endStr = '                } catch(e) {}\n            }';
    let endIdx = code.indexOf(endStr, startIdx);
    
    if (endIdx !== -1) {
        endIdx += endStr.length;
        code = code.substring(0, startIdx) + newLoop + code.substring(endIdx);
        fs.writeFileSync(path, code);
        console.log("Replaced perfectly");
    } else {
        // Fallback for weird newlines
        const endStr2 = '} catch(e) {}';
        endIdx = code.indexOf(endStr2, startIdx + 1000);
        endIdx = code.indexOf('}', endIdx + endStr2.length) + 1;
        code = code.substring(0, startIdx) + newLoop + code.substring(endIdx);
        fs.writeFileSync(path, code);
        console.log("Replaced using fallback");
    }
} else {
    console.log("Could not find old loop string");
}
