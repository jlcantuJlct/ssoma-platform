const fs = require('fs');

let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const botiquinHeader = `
                } else if (isBotiquin) {
                    worksheet.getCell("C4").value = meta.proyecto || "";
                    worksheet.getCell("C5").value = meta.fecha || "";
                    worksheet.getCell("I5").value = meta.hora || "";
                    worksheet.getCell("D6").value = meta.inspector || "";
                    worksheet.getCell("D7").value = meta.cargo || "";
                    worksheet.getCell("D8").value = meta.ubicacion || meta.responsable || "";
                    
                    if (meta.tipoInspeccion === 'Planificada' || data.tipoInspeccion === 'Planificada') {
                        worksheet.getCell("A10").value = "x";
                    } else {
                        worksheet.getCell("A11").value = "x";
                    }
                    
                    if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                        try { const imgId = workbook.addImage({ base64: firmas.inspectorFirma.replace(/^data:image\\/\\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 5 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                    }
                    if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                        try { const imgId = workbook.addImage({ base64: firmas.responsableFirma.replace(/^data:image\\/\\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                    }
`;

c = c.replace(
    /\} else if \(isCampamento \|\| isCocinaComedor \|\| isLaboratorio\) \{/,
    `${botiquinHeader} } else if (isCampamento || isCocinaComedor || isLaboratorio) {`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Injected Botiquin header mapping");
