const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `worksheet.getCell("A79").value = observaciones;
            worksheet.getCell("A79").alignment = { wrapText: true, vertical: "top" };
            worksheet.getCell("J83").value = firmas.capatazNombre || meta.operador || "";
            worksheet.getCell("J84").value = firmas.capatazNombre || "";`;

const replacement1 = `try { worksheet.mergeCells("A79:Y82"); } catch(e) {}
            worksheet.getCell("A79").value = observaciones;
            worksheet.getCell("A79").alignment = { wrapText: true, vertical: "top" };
            worksheet.getCell("J83").value = firmas.operadorNombre || meta.operador || "";
            worksheet.getCell("J84").value = firmas.capatazNombre || "";
            
            if (firmas.operadorFirma && typeof firmas.operadorFirma === 'string' && firmas.operadorFirma.includes('data:image')) {
                try {
                    const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                    const imageId = workbook.addImage({ base64: stripB64(firmas.operadorFirma), extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 19, row: 82 }, ext: { width: 140, height: 40 } });
                } catch(e) { console.error("Error firma operador maq:", e); }
            }
            if (firmas.capatazFirma && typeof firmas.capatazFirma === 'string' && firmas.capatazFirma.includes('data:image')) {
                try {
                    const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                    const imageId = workbook.addImage({ base64: stripB64(firmas.capatazFirma), extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 19, row: 83 }, ext: { width: 140, height: 40 } });
                } catch(e) { console.error("Error firma capataz maq:", e); }
            }`;

c = c.replace(target1, replacement1);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export-excel machinery signatures');
