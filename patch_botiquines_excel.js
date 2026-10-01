const fs = require('fs');

let route = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Disable old Manejador 1
route = route.replace(
    /if \(isBotiquin && fs\.existsSync\(templatePath\)\) \{/,
    `if (false && fs.existsSync(templatePath)) {`
);

// Inject isBotiquin flag
route = route.replace(
    /const isLaboratorio = [^\n]+;/,
    `$&
    const isBotiquin = data.isBotiquinesMatrix || (moduleName && moduleName.toLowerCase().includes("botiquin"));
    if (isBotiquin) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Botiquines.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }`
);

// Add to Manejador 5
route = route.replace(
    /else if \(isAlmacen \|\| isTalleres \|\| isCampamento \|\| isInstalacionesElectricas \|\| isCocinaComedor \|\| isLaboratorio\) \{/,
    `else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor || isLaboratorio || isBotiquin) {`
);

// Add Template backwards compatibility to Manejador 5
route = route.replace(
    /const checklist = data\.checklist \|\| \(data\.template && !Array\.isArray\(data\.template\) \? data\.template : \{\}\);/,
    `let checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});
          if (Object.keys(checklist).length === 0 && Array.isArray(data.template)) {
              data.template.forEach(item => {
                  if (item.type === 'radio' && item.value) {
                      checklist[item.text] = item.value;
                  }
              });
          }`
);

// Add to headers
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
route = route.replace(/\} else if \(isLaboratorio\) \{/g, botiquinHeader + '} else if (isLaboratorio) {');

// Add to obs cell start
route = route.replace(
    /else if \(isLaboratorio\) \{ obsCellStart = "A36"; obsCellEnd = "M42"; \}/,
    `$& else if (isBotiquin) { obsCellStart = "A35"; obsCellEnd = "M42"; }`
);

// Add to unMergeCells
route = route.replace(
    /else if \(isLaboratorio\) \{ for\(let r=36; r<=42; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \} \}/,
    `$& else if (isBotiquin) { for(let r=35; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }`
);

// Add to photos row
route = route.replace(
    /else if \(isLaboratorio\) currentImgRow = 44;/,
    `$& else if (isBotiquin) currentImgRow = 44;`
);

fs.writeFileSync('app/api/export-excel/route.ts', route);
console.log("Patched export-excel for Botiquines");
