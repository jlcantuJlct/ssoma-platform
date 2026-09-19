const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
const lines = code.split('\n');

const tallerCode = `
        else if (isTalleres) {
            if (fs.existsSync(templatePath)) {
                const templateDef = data.template || [];
                const answers = data.answers || [];

                let proyecto = 'RED VIAL 6', area = '', fecha = '', inspector = '', cargo = '', responsable = '', firmaInspector = '', firmaResponsable = '';
                
                templateDef.forEach((t, idx) => {
                    const text = (t.text || '').toLowerCase();
                    const val = answers[idx]?.text || '';
                    const sig = answers[idx]?.signature || '';
                    
                    if (text.includes('proyecto')) proyecto = val || proyecto;
                    else if (text.includes('área de inspección') || text.includes('area especifica') || text.includes('area de inspeccion')) area = val;
                    else if (text.includes('fecha')) fecha = val;
                    else if (text.includes('inspector') || text.includes('nombre y apellido')) {
                        inspector = val;
                        if (sig) firmaInspector = sig;
                    }
                    else if (text.includes('cargo') && !text.includes('responsable')) cargo = val;
                    else if (text.includes('responsable')) {
                        responsable = val;
                        if (sig) firmaResponsable = sig;
                    }
                });

                worksheet.getCell('C4').value = proyecto;
                worksheet.getCell('D5').value = area;
                worksheet.getCell('K5').value = fecha;
                worksheet.getCell('C6').value = inspector;
                worksheet.getCell('C7').value = cargo;
                worksheet.getCell('D8').value = responsable;

                if (firmaInspector) {
                    try {
                        const base64Data = firmaInspector.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } });
                    } catch(e) {}
                }

                if (firmaResponsable) {
                    try {
                        const base64Data = firmaResponsable.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 40 } });
                    } catch(e) {}
                }

                const isPlanificada = templateDef.findIndex((t) => t.text && t.text.toLowerCase().includes('planificada') && !t.text.toLowerCase().includes('no planificada'));
                const isNoPlanificada = templateDef.findIndex((t) => t.text && t.text.toLowerCase().includes('no planificada'));
                const isOtro = templateDef.findIndex((t) => t.text && t.text.toLowerCase().trim() === 'otro');
                
                if (isPlanificada !== -1 && answers[isPlanificada]?.text === 'X') { worksheet.getCell('A10').value = 'X'; worksheet.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isNoPlanificada !== -1 && answers[isNoPlanificada]?.text === 'X') { worksheet.getCell('A11').value = 'X'; worksheet.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isOtro !== -1 && answers[isOtro]?.text === 'X') { worksheet.getCell('A12').value = 'X'; worksheet.getCell('A12').alignment = { horizontal: 'center', vertical: 'middle' }; }

                const obsIndex = templateDef.findIndex((t) => t.text && (t.text.toLowerCase().includes('observacion') || t.text.toLowerCase().includes('comentario')));
                if (obsIndex !== -1 && answers[obsIndex]?.text) {
                    worksheet.getCell('A39').value = answers[obsIndex].text;
                    worksheet.getCell('A39').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                }

                let currentPhotoRow = 48; 
                let hasPhotos = false;

                worksheet.getCell(\`A\${currentPhotoRow}\`).value = "REGISTRO FOTOGRÁFICO DE HALLAZGOS:";
                worksheet.getCell(\`A\${currentPhotoRow}\`).font = { bold: true };
                currentPhotoRow += 2;
                let colCursor = 1;

                templateDef.forEach((item, idx) => {
                    const text = (item.text || '').toLowerCase();
                    if (['proyecto', 'fecha', 'inspector', 'cargo', 'responsable', 'planificada', 'observacion', 'comentario'].some(k => text.includes(k))) return;

                    const ans = answers[idx];
                    if (!ans) return;
                    
                    let targetRow = -1;
                    for (let r = 15; r <= 35; r++) {
                        let cellB = worksheet.getCell(\`B\${r}\`).value;
                        if (cellB && typeof cellB === 'object' && cellB.richText) cellB = cellB.richText.map(t => t.text).join('');
                        if (cellB && typeof cellB === 'string') {
                            const bClean = cellB.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                            const tClean = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                            if (bClean.length > 5 && (tClean.includes(bClean) || bClean.includes(tClean))) {
                                targetRow = r;
                                break;
                            }
                        }
                    }

                    if (targetRow !== -1) {
                        const status = ans.text;
                        if (status === 'C') worksheet.getCell(\`K\${targetRow}\`).value = 'X';
                        else if (status === 'NC') worksheet.getCell(\`L\${targetRow}\`).value = 'X';
                        else if (status === 'N/A') worksheet.getCell(\`M\${targetRow}\`).value = 'X';

                        ['K', 'L', 'M'].forEach(c => {
                            worksheet.getCell(\`\${c}\${targetRow}\`).alignment = { horizontal: 'center', vertical: 'middle' };
                            worksheet.getCell(\`\${c}\${targetRow}\`).font = { bold: true };
                        });

                        if (ans.photos && ans.photos.length > 0) {
                            hasPhotos = true;
                            worksheet.getCell(\`A\${currentPhotoRow}\`).value = \`Hallazgo: \${item.text}\`;
                            currentPhotoRow += 1;
                            ans.photos.forEach((fotoB64) => {
                                try {
                                    const base64Data = fotoB64.replace(/^data:image\\/\\w+;base64,/, "");
                                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                                    worksheet.addImage(imageId, {
                                        tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                                        ext: { width: 280, height: 280 }
                                    });
                                    colCursor += 5;
                                    if (colCursor > 10) { colCursor = 1; currentPhotoRow += 15; }
                                } catch(e) {}
                            });
                            if (colCursor > 1) { colCursor = 1; currentPhotoRow += 15; }
                        }
                    }
                });

                if (!hasPhotos) worksheet.getCell(\`A48\`).value = ""; 

            } else {
                throw new Error("La plantilla 'Inspección de Talleres.xlsx' no se encuentra.");
            }
        }
`;

let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// --- MANEJADOR 6: INSPECCIONES DIGITALES GENÉRICAS ---')) {
        insertIdx = i;
        break;
    }
}

if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, tallerCode);
    fs.writeFileSync('app/api/export-excel/route.ts', lines.join('\n'));
    console.log('Inserted Taller handler at ' + insertIdx);
} else {
    console.log('Could not find insert index!');
}
