const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `                worksheet.getCell("D8").value = meta.responsable || "";
            } else {`;
const rep = `                worksheet.getCell("D8").value = meta.responsable || "";
                
                if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                    try {
                        const base64Data = firmas.inspectorFirma.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 10, row: 6 }, ext: { width: 140, height: 40 } });
                    } catch(e) {}
                }
                if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                    try {
                        const base64Data = firmas.responsableFirma.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 140, height: 40 } });
                    } catch(e) {}
                }
            } else {`;

c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed Campamento Signatures');
