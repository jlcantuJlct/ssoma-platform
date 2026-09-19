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
                    } else if (normText.includes('especifica') || (normText.includes('area') && normText.includes('inspeccion'))) {
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
                    } else if (normText.includes('firma')) {
                        if (normText.includes('inspector') && sig) firmaInspector = sig;
                        else if (normText.includes('responsable') && sig) firmaResponsable = sig;
                        else if (!firmaInspector && sig) firmaInspector = sig;
                        else if (!firmaResponsable && sig) firmaResponsable = sig;
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
                        worksheet.addImage(imageId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 35 } });
                    } catch(e) {}
                }

                if (firmaResponsable) {
                    try {
                        const base64Data = firmaResponsable.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 35 } });
                    } catch(e) {}
                }

                const isPlanificada = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().includes('planificada') && !t.text.toLowerCase().includes('no planificada'));
                const isNoPlanificada = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().includes('no planificada'));
                const isOtro = templateDef.findIndex((t: any) => t.text && t.text.toLowerCase().trim() === 'otro');
                
                if (isPlanificada !== -1 && (answers[isPlanificada]?.text === 'X' || answers[isPlanificada]?.text === 'true' || answers[isPlanificada]?.text === true)) { worksheet.getCell('A10').value = 'X'; worksheet.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isNoPlanificada !== -1 && (answers[isNoPlanificada]?.text === 'X' || answers[isNoPlanificada]?.text === 'true' || answers[isNoPlanificada]?.text === true)) { worksheet.getCell('A11').value = 'X'; worksheet.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' }; }
                if (isOtro !== -1 && (answers[isOtro]?.text === 'X' || answers[isOtro]?.text === 'true' || answers[isOtro]?.text === true)) { worksheet.getCell('A12').value = 'X'; worksheet.getCell('A12').alignment = { horizontal: 'center', vertical: 'middle' }; }

                // Auto-generate NC observations list under 'A39' (Observaciones)
                let hallazgosNC: string[] = [];
                templateDef.forEach((item: any, idx: number) => {
                    const normText = (item.text || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    if (['proyecto', 'fecha', 'inspector', 'cargo', 'responsable', 'planificada', 'observacion', 'comentario', 'area', 'especifica'].some(k => normText.includes(k))) return;

                    const ans = answers[idx];
                    if (ans) {
                        const normAns = String(ans.text || '').toUpperCase().trim();
                        if (normAns === 'NC' || normAns === 'FALSE' || normAns.includes('NO')) {
                            hallazgosNC.push(\`- \${item.text} (NC)\`);
                        }
                    }
                });

                let finalObsText = '';
                const obsIndex = templateDef.findIndex((t: any) => t.text && (t.text.toLowerCase().includes('observacion') || t.text.toLowerCase().includes('comentario')));
                if (obsIndex !== -1 && answers[obsIndex]?.text) {
                    finalObsText = answers[obsIndex].text;
                }

                if (hallazgosNC.length > 0 && !finalObsText.includes('NC')) {
                    if (finalObsText) finalObsText += '\\n\\n';
                    finalObsText += 'Hallazgos Registrados:\\n' + hallazgosNC.join('\\n');
                }

                if (finalObsText) {
                    worksheet.getCell('A39').value = finalObsText;
                    for (let r = 39; r <= 44; r++) {
                        for (let c = 1; c <= 13; c++) {
                            worksheet.getCell(r, c).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                        }
                    }
                }

                // Grid evaluations (Columns K=Cumple, L=No Cumple, M=N/A)
                templateDef.forEach((item: any, idx: number) => {
                    const origText = item.text || '';
                    const normText = origText.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
                    if (['proyecto', 'fecha', 'inspector', 'cargo', 'responsable', 'planificada', 'observacion', 'comentario', 'area', 'especifica'].some(k => normText.includes(k))) return;

                    const ans = answers[idx];
                    if (!ans) return;
                    
                    let targetRow = -1;
                    for (let r = 15; r <= 35; r++) {
                        let cellB = worksheet.getCell(\`B\${r}\`).value;
                        if (cellB && typeof cellB === 'object' && cellB.richText) cellB = cellB.richText.map((t: any) => t.text).join('');
                        if (cellB && typeof cellB !== 'undefined' && cellB !== null) {
                            const bNorm = String(cellB).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
                            const bClean = bNorm.replace(/[^a-zA-Z0-9]/g, '');
                            const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');
                            if (bClean.length > 5 && (tClean.includes(bClean) || bClean.includes(tClean))) {
                                targetRow = r;
                                break;
                            }
                        }
                    }

                    if (targetRow !== -1) {
                        const normAns = String(ans.text || '').toUpperCase().trim();
                        if (normAns === 'C' || normAns === 'X' || normAns === 'TRUE' || normAns === 'CUMPLE') {
                            worksheet.getCell(\`K\${targetRow}\`).value = 'X';
                        } else if (normAns === 'NC' || normAns === 'FALSE' || normAns.includes('NO')) {
                            worksheet.getCell(\`L\${targetRow}\`).value = 'X';
                        } else if (normAns.includes('N/A') || normAns.includes('NA')) {
                            worksheet.getCell(\`M\${targetRow}\`).value = 'X';
                        }

                        ['K', 'L', 'M'].forEach(c => {
                            worksheet.getCell(\`\${c}\${targetRow}\`).alignment = { horizontal: 'center', vertical: 'middle' };
                            worksheet.getCell(\`\${c}\${targetRow}\`).font = { bold: true };
                        });
                    }
                });

                // Row 47 Photo Gallery (~5cm x 5cm / 150px x 150px)
                let currentPhotoRow = 47; 
                let hasPhotos = false;

                worksheet.getCell(\`A\${currentPhotoRow}\`).value = "REGISTRO FOTOGRÁFICO DE HALLAZGOS:";
                worksheet.getCell(\`A\${currentPhotoRow}\`).font = { bold: true, size: 11 };
                currentPhotoRow += 2;
                let colCursor = 1;

                const renderPhotosForFinding = (itemName: string, photosList: string[]) => {
                    if (photosList && photosList.length > 0) {
                        hasPhotos = true;
                        worksheet.getCell(\`A\${currentPhotoRow}\`).value = \`Hallazgo: \${itemName}\`;
                        worksheet.getCell(\`A\${currentPhotoRow}\`).font = { bold: true };
                        currentPhotoRow += 1;

                        photosList.forEach((fotoB64: string) => {
                            try {
                                const base64Data = fotoB64.replace(/^data:image\\/\\w+;base64,/, "");
                                const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                                worksheet.addImage(imageId, {
                                    tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                                    ext: { width: 150, height: 150 }
                                });
                                colCursor += 4;
                                if (colCursor > 9) { 
                                    colCursor = 1; 
                                    currentPhotoRow += 9;
                                }
                            } catch(e) {}
                        });
                        if (colCursor > 1) { 
                            colCursor = 1; 
                            currentPhotoRow += 9;
                        }
                    }
                };

                if (data.fotosDefectos && Object.keys(data.fotosDefectos).length > 0) {
                    Object.keys(data.fotosDefectos).forEach((itemName) => {
                        renderPhotosForFinding(itemName, data.fotosDefectos[itemName]);
                    });
                }

                templateDef.forEach((item: any, idx: number) => {
                    const ans = answers[idx];
                    if (ans && ans.photos && ans.photos.length > 0) {
                        renderPhotosForFinding(item.text, ans.photos);
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
console.log('Applied NFD matching fix on cellB and multiline wrapText fix on A39!');
