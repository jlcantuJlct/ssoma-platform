const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    "const isCampamento =",
    "const isInstalacionesElectricas = data.isInstalacionesElectricasMatrix || (moduleName && moduleName.toLowerCase().includes('eléctrica') || moduleName && moduleName.toLowerCase().includes('electrica'));\n      const isCampamento ="
);

c = c.replace(
    "else if (isAlmacen || isTalleres || isCampamento) {",
    "else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas) {"
);

c = c.replace(
    "if (isCampamento) {",
    "if (isInstalacionesElectricas) {\n                    for(let r=47; r<=51; r++) { try { worksheet.unMergeCells(\"A\"+r+\":M\"+r); } catch(e){} }\n                    worksheet.getCell(\"A47\").value = observaciones;\n                    worksheet.getCell(\"A47\").font = { color: { argb: 'FF000000' } };\n                    \n                    if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {\n                        try {\n                            const base64Data = firmas.inspectorFirma.replace(/^data:image\\/\\w+;base64,/, \"\");\n                            const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });\n                            worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 40 } });\n                        } catch(e) {}\n                    }\n                    if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {\n                        try {\n                            const base64Data = firmas.responsableFirma.replace(/^data:image\\/\\w+;base64,/, \"\");\n                            const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });\n                            worksheet.addImage(imageId, { tl: { col: 10, row: 8 }, ext: { width: 120, height: 40 } });\n                        } catch(e) {}\n                    }\n                } else if (isCampamento) {"
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Updated export-excel');
