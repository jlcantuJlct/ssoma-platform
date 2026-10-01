const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// 1. Add isLaboratorio boolean
c = c.replace(
    /const isCocinaComedor = data\.isCocinaComedorMatrix \|\| \(moduleName && \(moduleName\.toLowerCase\(\)\.includes\('cocina'\) \|\| moduleName\.toLowerCase\(\)\.includes\('comedor'\)\)\);/g,
    `const isCocinaComedor = data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes('cocina') || moduleName.toLowerCase().includes('comedor')));\n      const isLaboratorio = data.isLaboratorioMatrix || (moduleName && moduleName.toLowerCase().includes('laboratorio'));`
);

// 2. Add template path for Laboratorio
c = c.replace(
    /if \(data\.isCocinaComedorMatrix \|\| \(moduleName && \(moduleName\.toLowerCase\(\)\.includes\("cocina"\) \|\| moduleName\.toLowerCase\(\)\.includes\("comedor"\)\)\)\) \{\n\s*const alt1 = path\.join\(process\.cwd\(\), "public", "templates", "digital", "Inspeccion de cocina y comedor\.xlsx"\);\n\s*if \(fs\.existsSync\(alt1\)\) templatePath = alt1;\n\s*\}/m,
    `if (data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes("cocina") || moduleName.toLowerCase().includes("comedor")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de cocina y comedor.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }
      if (data.isLaboratorioMatrix || (moduleName && moduleName.toLowerCase().includes("laboratorio"))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Laboratorio.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`
);

// 3. Add to Manejador 5 condition
c = c.replace(
    /else if \(isAlmacen \|\| isTalleres \|\| isCampamento \|\| isInstalacionesElectricas \|\| isCocinaComedor\) \{/g,
    `else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor || isLaboratorio) {`
);

// 4. Add header and logic block for Laboratorio
const labHeader = `if (isLaboratorio) {
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
                  } else if (isCocinaComedor) {`;

c = c.replace(/if\s*\(isCocinaComedor\)\s*\{/g, labHeader);

// 5. Add obsCellStart and obsCellEnd for Laboratorio
c = c.replace(
    /\} else if \(isCocinaComedor\) \{\s*obsCellStart = "A55";\s*obsCellEnd = "M59";\s*\}/m,
    `} else if (isCocinaComedor) {\n                    obsCellStart = "A55";\n                    obsCellEnd = "M59";\n                } else if (isLaboratorio) {\n                    obsCellStart = "A36";\n                    obsCellEnd = "M42";\n                }`
);

// 6. Add unMergeCells loop for Laboratorio
c = c.replace(
    /\} else if \(isCocinaComedor\) \{\s*for\(let r=55; r<=59; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \}\s*\}/m,
    `} else if (isCocinaComedor) {\n                        for(let r=55; r<=59; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                    } else if (isLaboratorio) {\n                        for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                    }`
);

// 7. Add currentImgRow for Laboratorio
c = c.replace(
    /else if \(isCocinaComedor\) currentImgRow = 61;/m,
    `else if (isCocinaComedor) currentImgRow = 61;\n              else if (isLaboratorio) currentImgRow = 44;`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added logic for isLaboratorio in export-excel');
