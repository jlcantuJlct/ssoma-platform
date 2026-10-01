const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const oldMapLogic = `            // Mapeo dinámico de items
            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                    const text = (cell.value && typeof cell.value === 'object' && cell.value.richText) 
                        ? cell.value.richText.map(rt => rt.text).join('') 
                        : String(cell.value || '');
                    
                    const cleanText = text.trim();
                    if (checklist[cleanText]) {
                        const val = checklist[cleanText];
                        const offset = getOffset(cleanText, val);
                        if (offset !== null) {
                            worksheet.getCell(rowNum, colNum + offset).value = "x";
                            worksheet.getCell(rowNum, colNum + offset).font = { bold: true };
                            worksheet.getCell(rowNum, colNum + offset).alignment = { horizontal: "center", vertical: "middle" };
                        }
                    }
                });
            });

            worksheet.getCell("A79").value = observaciones;
            worksheet.getCell("A79").alignment = { wrapText: true, vertical: "top" };
            worksheet.getCell("J83").value = firmas.capatazNombre || meta.operador || "";
            worksheet.getCell("J84").value = firmas.capatazNombre || "";`;

const newMapLogic = `            // Mapeo dinámico de items (con prevención de duplicados en la misma fila debido a celdas combinadas)
            let rowProcessed = {};
            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                    const text = (cell.value && typeof cell.value === 'object' && cell.value.richText) 
                        ? cell.value.richText.map(rt => rt.text).join('') 
                        : String(cell.value || '');
                    
                    const cleanText = text.trim();
                    if (checklist[cleanText] && !rowProcessed[rowNum + "_" + cleanText]) {
                        rowProcessed[rowNum + "_" + cleanText] = true;
                        const val = checklist[cleanText];
                        const offset = getOffset(cleanText, val);
                        if (offset !== null) {
                            worksheet.getCell(rowNum, colNum + offset).value = "x";
                            worksheet.getCell(rowNum, colNum + offset).font = { bold: true };
                            worksheet.getCell(rowNum, colNum + offset).alignment = { horizontal: "center", vertical: "middle" };
                        }
                    }
                });
            });

            worksheet.getCell("A79").value = observaciones;
            worksheet.getCell("A79").alignment = { wrapText: true, vertical: "top" };
            worksheet.getCell("J83").value = firmas.capatazNombre || meta.operador || "";
            worksheet.getCell("J84").value = firmas.capatazNombre || "";

            // --- INYECCIÓN DE REGISTRO FOTOGRÁFICO Y LEVANTAMIENTO ---
            let currentImgRow = 108;
            const badItemsKeys = Object.keys(checklist).filter(k => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(checklist[k]));
            let hasPhotos = false;
            
            badItemsKeys.forEach((item) => {
                const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                if (photos && photos.length > 0) {
                    hasPhotos = true;
                }
            });

            if (hasPhotos || data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                worksheet.getCell(\`B\${currentImgRow}\`).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA";
                worksheet.getCell(\`B\${currentImgRow}\`).font = { bold: true, size: 12 };
                worksheet.getCell(\`O\${currentImgRow}\`).value = "EVIDENCIA FOTOGRÁFICA DEL LEVANTAMIENTO";
                worksheet.getCell(\`O\${currentImgRow}\`).font = { bold: true, size: 12 };
                currentImgRow += 2;

                if (data.comentarioLevantamiento) {
                    worksheet.getCell(\`O\${currentImgRow}\`).value = "Comentario: " + data.comentarioLevantamiento;
                    currentImgRow += 2;
                }

                if (!hasPhotos && data.evidenciaLevantamiento) {
                    try {
                        const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                        const evId = workbook.addImage({ base64: stripB64(data.evidenciaLevantamiento), extension: "png" });
                        worksheet.addImage(evId, {
                            tl: { col: 14, row: currentImgRow + 1 },
                            ext: { width: 300, height: 300 }
                        });
                    } catch(e) {}
                    currentImgRow += 16;
                }

                badItemsKeys.forEach((item) => {
                    const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                    if (photos && photos.length > 0) {
                        worksheet.getCell(\`B\${currentImgRow}\`).value = \`Hallazgo: \${item}\`;
                        worksheet.getCell(\`B\${currentImgRow}\`).font = { bold: true };
                        
                        try {
                            const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                            const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                            worksheet.addImage(imageId, {
                                tl: { col: 1, row: currentImgRow + 1 },
                                ext: { width: 300, height: 300 }
                            });
                            
                            if (data.evidenciaLevantamiento) {
                                const evId = workbook.addImage({ base64: stripB64(data.evidenciaLevantamiento), extension: "png" });
                                worksheet.addImage(evId, {
                                    tl: { col: 14, row: currentImgRow + 1 },
                                    ext: { width: 300, height: 300 }
                                });
                            }
                        } catch(e) {}
                        
                        currentImgRow += 16;
                    }
                });
            }`;

const idx = c.indexOf(oldMapLogic);
if (idx !== -1) {
    c = c.substring(0, idx) + newMapLogic + c.substring(idx + oldMapLogic.length);
    fs.writeFileSync('app/api/export-excel/route.ts', c);
    console.log("Successfully replaced map logic");
} else {
    console.log("Could not find oldMapLogic!");
}
