const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const oldTallerBlockRegex = /else if \(isTalleres\) \{[\s\S]*?\}\s*else \{/;

const newTallerBlock = `else if (isTalleres) {
            if (fs.existsSync(templatePath)) {
                const templateDef = data.template || [];
                const answers = data.answers || [];

                let proyecto = 'RED VIAL 6', area = '', fecha = '', inspector = '', cargo = '', responsable = '', firmaInspector = '', firmaResponsable = '';
                
                templateDef.forEach((t: any, idx: number) => {
                    const origText = t.text || '';
                    const normText = origText.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    const val = answers[idx]?.text || '';
                    const sig = answers[idx]?.signature || '';
                    
                    if (normText.includes('proyecto')) {
                        proyecto = val || proyecto;
                    } else if (normText.includes('area') || normText.includes('especifica')) {
                        area = val;
                    } else if (normText.includes('fecha')) {
                        fecha = val;
                    } else if (normText.includes('inspector') || (normText.includes('nombre') && normText.includes('apellido'))) {
                        inspector = val;
                        if (sig) firmaInspector = sig;
                    } else if (normText.includes('cargo') && !normText.includes('responsable')) {
                        cargo = val;
                    } else if (normText.includes('responsable')) {
                        responsable = val;
                        if (sig) firmaResponsable = sig;
                    }
                });

                worksheet.getCell('C4').value = proyecto;
                worksheet.getCell('D5').value = area;
                worksheet.getCell('K5').value = fecha;
                worksheet.getCell('D6').value = inspector;
                worksheet.getCell('D7').value = cargo;
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

                const isPlanificada = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().includes('planificada') && !t.text.toLowerCase().includes('no planificada'));
                const isNoPlanificada = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().includes('no planificada'));
                const isOtro = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().trim() === 'otro');
                
                if (isPlanificada !== -1 && (answers[isPlanificada]?.text === 'X' || answers[isPlanificada]?.text === 'true' || answers[isPlanificada]?.text === true)) { worksheet.getCell('A10').value = 'X'; worksheet.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isNoPlanificada !== -1 && (answers[isNoPlanificada]?.text === 'X' || answers[isNoPlanificada]?.text === 'true' || answers[isNoPlanificada]?.text === true)) { worksheet.getCell('A11').value = 'X'; worksheet.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isOtro !== -1 && (answers[isOtro]?.text === 'X' || answers[isOtro]?.text === 'true' || answers[isOtro]?.text === true)) { worksheet.getCell('A12').value = 'X'; worksheet.getCell('A12').alignment = { horizontal: 'center', vertical: 'middle' }; }

                const obsIndex = templateDef.findIndex((t: any) => t.text && (t.text.toLowerCase().includes('observacion') || t.text.toLowerCase().includes('comentario')));
                if (obsIndex !== -1 && answers[obsIndex]?.text) {
                    worksheet.getCell('A39').value = answers[obsIndex].text;
                    worksheet.getCell('A39').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                }

                let currentPhotoRow = 47; 
                let hasPhotos = false;

                worksheet.getCell(\`A\${currentPhotoRow}\`).value = "REGISTRO FOTOGRÁFICO DE HALLAZGOS:";
                worksheet.getCell(\`A\${currentPhotoRow}\`).font = { bold: true };
                currentPhotoRow += 2;
                let colCursor = 1;

                templateDef.forEach((item: any, idx: number) => {
                    const text = (item.text || '').toLowerCase();
                    if (['proyecto', 'fecha', 'inspector', 'cargo', 'responsable', 'planificada', 'observacion', 'comentario', 'area', 'especifica'].some(k => text.includes(k))) return;

                    const ans = answers[idx];
                    if (!ans) return;
                    
                    let targetRow = -1;
                    for (let r = 15; r <= 35; r++) {
                        let cellB = worksheet.getCell(\`B\${r}\`).value;
                        if (cellB && typeof cellB === 'object' && cellB.richText) cellB = cellB.richText.map((t: any) => t.text).join('');
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
                        if (status === 'C' || status === 'X' || status === 'true' || status === true) worksheet.getCell(\`K\${targetRow}\`).value = 'X';
                        else if (status === 'NC' || status === 'false' || status === false) worksheet.getCell(\`L\${targetRow}\`).value = 'X';
                        else if (status === 'N/A') worksheet.getCell(\`M\${targetRow}\`).value = 'X';

                        ['K', 'L', 'M'].forEach(c => {
                            worksheet.getCell(\`\${c}\${targetRow}\`).alignment = { horizontal: 'center', vertical: 'middle' };
                            worksheet.getCell(\`\${c}\${targetRow}\`).font = { bold: true };
                        });

                        if (ans.photos && ans.photos.length > 0) {
                            hasPhotos = true;
                            worksheet.getCell(\`A\${currentPhotoRow}\`).value = \`Hallazgo: \${item.text}\`;
                            currentPhotoRow += 1;
                            ans.photos.forEach((fotoB64: string) => {
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

                if (!hasPhotos) worksheet.getCell(\`A47\`).value = ""; 

            } else {
                throw new Error("La plantilla 'Inspección de Talleres.xlsx' no se encuentra.");
            }
        }
        else {`;

code = code.replace(oldTallerBlockRegex, newTallerBlock);
fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('Successfully updated Talleres export mapping in export-excel route!');
