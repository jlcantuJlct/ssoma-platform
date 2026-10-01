const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /if \(isInstalacionesElectricas\) \{[\s\S]*?\} else if \(isCampamento\)/m;

const replacement = `if (isInstalacionesElectricas) {
                    worksheet.getCell("C4").value = meta.proyecto || "";
                    worksheet.getCell("E5").value = meta.area || "";
                    worksheet.getCell("K5").value = meta.fecha || "";
                    worksheet.getCell("D6").value = meta.inspector || "";
                    worksheet.getCell("D8").value = meta.responsable || "";
                    
                    for(let r=47; r<=51; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }
                    worksheet.getCell("A47").value = observaciones;
                    worksheet.getCell("A47").font = { color: { argb: 'FF000000' } };
                    
                    if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                        try {
                            const base64Data = firmas.inspectorFirma.replace(/^data:image\\/\\w+;base64,/, "");
                            const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                            worksheet.addImage(imageId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } });
                        } catch(e) {}
                    }
                    if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                        try {
                            const base64Data = firmas.responsableFirma.replace(/^data:image\\/\\w+;base64,/, "");
                            const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                            worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 40 } });
                        } catch(e) {}
                    }
                } else if (isCampamento)`;

c = c.replace(regex, replacement);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed Instalaciones coords');
