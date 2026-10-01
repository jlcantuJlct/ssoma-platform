const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const cocinaHeader = `if (isCocinaComedor) {
                      worksheet.getCell("E4").value = meta.proyecto || "";
                      worksheet.getCell("E5").value = meta.area || "";
                      worksheet.getCell("K5").value = meta.fecha || "";
                      worksheet.getCell("D6").value = meta.inspector || "";
                      worksheet.getCell("D7").value = meta.cargo || "";
                      worksheet.getCell("D8").value = meta.responsable || "";
                      
                      if (meta.tipoInspeccion === 'Planificada' || data.tipoInspeccion === 'Planificada') {
                          worksheet.getCell("C10").value = "x";
                      } else {
                          worksheet.getCell("C11").value = "x";
                      }
                      
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
                  } else if (isInstalacionesElectricas) {`;

c = c.replace(/if\s*\(isInstalacionesElectricas\)\s*\{/g, cocinaHeader);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Injected Cocina headers successfully");
