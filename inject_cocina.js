const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const instElecHeader = `if (isInstalacionesElectricas) {
                      worksheet.getCell("C4").value = meta.proyecto || "";`;
                      
const cocinaHeader = `if (isCocinaComedor) {
                      worksheet.getCell("E4").value = meta.proyecto || "";
                      worksheet.getCell("E5").value = meta.area || "";
                      worksheet.getCell("K5").value = meta.fecha || "";
                      worksheet.getCell("D6").value = meta.inspector || "";
                      worksheet.getCell("D7").value = meta.cargo || "";
                      worksheet.getCell("D8").value = meta.responsable || "";
                      
                      if (meta.tipoInspeccion === 'Planificada') {
                          worksheet.getCell("C10").value = "x";
                      } else if (meta.tipoInspeccion === 'No Planificada') {
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
                  } else if (isInstalacionesElectricas) {
                      worksheet.getCell("C4").value = meta.proyecto || "";`;
                      
c = c.replace(instElecHeader, cocinaHeader);

c = c.replace(
    /else if \(isInstalacionesElectricas\) \{\s*obsCellStart = "A47";\s*obsCellEnd = "M52";\s*\}/m,
    `else if (isInstalacionesElectricas) {\n                  obsCellStart = "A47";\n                  obsCellEnd = "M52";\n              } else if (isCocinaComedor) {\n                  obsCellStart = "A55";\n                  obsCellEnd = "M59";\n              }`
);

c = c.replace(
    /else if \(isInstalacionesElectricas\) \{\s*for\(let r=47; r<=52; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \}\s*\}/m,
    `else if (isInstalacionesElectricas) {\n                      for(let r=47; r<=52; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                  } else if (isCocinaComedor) {\n                      for(let r=55; r<=59; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                  }`
);

c = c.replace(
    /else if \(isInstalacionesElectricas\) currentImgRow = 54;/m,
    `else if (isInstalacionesElectricas) currentImgRow = 54;\n              else if (isCocinaComedor) currentImgRow = 61;`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Injected headers, observations, and photos for Cocina y Comedor');
