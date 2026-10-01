const fs = require('fs');
const routeCode = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
let c = routeCode;

const flagInjection = `
    const isAlmacen = data.isAlmacenMatrix || (moduleName && moduleName.toLowerCase().includes("almacen"));
    const isTalleres = data.isTalleresMatrix || (moduleName && (moduleName.toLowerCase().includes("taller") || moduleName.toLowerCase().includes("talleres")));
    const isCampamento = data.isCampamentoMatrix || (moduleName && (moduleName.toLowerCase().includes("campamento") || moduleName.toLowerCase().includes("campamentos")));
    const isInstalacionesElectricas = data.isInstalacionesElectricasMatrix || (moduleName && (moduleName.toLowerCase().includes("eléctrica") || moduleName.toLowerCase().includes("electrica")));
    const isCocinaComedor = data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes("cocina") || moduleName.toLowerCase().includes("comedor")));
    const isLaboratorio = data.isLaboratorioMatrix || (moduleName && moduleName.toLowerCase().includes("laboratorio"));

    // Template Fallbacks
    if (isAlmacen) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de Almacen.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isTalleres) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de talleres.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isCampamento) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de campamento.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isInstalacionesElectricas) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de instalaciones eléctricas.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isCocinaComedor) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de cocina y comedor.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isLaboratorio) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Laboratorio.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
`;
c = c.replace(/const isInternas =[\s\S]*?normName\.includes\("ssoma"\);/m, `const isInternas = normName.includes("interna") && normName.includes("ssoma");\n${flagInjection}`);

const code = `
      // --- MANEJADOR 5: ALMACEN MATRICIAL ---
      else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor || isLaboratorio) {
          const meta = data.meta || data.answers || {};
          const checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});
          const firmas = data.firmas || meta.firmas || {};
          const observaciones = data.observaciones || meta.observaciones || "";
          
          if (fs.existsSync(templatePath)) {
              worksheet.getCell("A1").value = "";
              try {
                  const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
                  if (fs.existsSync(logoPath)) {
                      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
                      worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
                  }
              } catch(e) {}
              
              if (isAlmacen || isTalleres) {
                  worksheet.getCell("C4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell("D8").value = meta.responsable || "";
              } else if (isInstalacionesElectricas) {
                  worksheet.getCell("C4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell("D8").value = meta.responsable || "";
              } else if (isCampamento || isCocinaComedor || isLaboratorio) {
                  worksheet.getCell("E4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell(isCampamento ? "D7" : "D7").value = meta.cargo || ""; worksheet.getCell("D8").value = meta.responsable || "";
                  if (isCocinaComedor || isLaboratorio) {
                      if (meta.tipoInspeccion === 'Planificada' || data.tipoInspeccion === 'Planificada') worksheet.getCell("C10").value = "x";
                      else worksheet.getCell("C11").value = "x";
                  }
                  if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                      try { const imgId = workbook.addImage({ base64: firmas.inspectorFirma.replace(/^data:image\\/\\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                  }
                  if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                      try { const imgId = workbook.addImage({ base64: firmas.responsableFirma.replace(/^data:image\\/\\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                  }
              }
              
              let obsCellStart = "A83"; let obsCellEnd = "L86";
              if (isTalleres) { obsCellStart = "A39"; obsCellEnd = "M44"; }
              else if (isCampamento) { obsCellStart = "A57"; obsCellEnd = "M61"; }
              else if (isInstalacionesElectricas) { obsCellStart = "A47"; obsCellEnd = "M52"; }
              else if (isCocinaComedor) { obsCellStart = "A55"; obsCellEnd = "M59"; }
              else if (isLaboratorio) { obsCellStart = "A36"; obsCellEnd = "M42"; }
              
              try { 
                  if (isCampamento) { for(let r=57; r<=61; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isInstalacionesElectricas) { for(let r=47; r<=52; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isCocinaComedor) { for(let r=55; r<=59; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isLaboratorio) { for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isTalleres) { for(let r=39; r<=44; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  worksheet.mergeCells(obsCellStart + ":" + obsCellEnd); 
              } catch(e) {}
              
              worksheet.getCell(obsCellStart).value = observaciones;
              worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };
              worksheet.getCell(obsCellStart).font = { name: "Arial", size: 10, color: { argb: "FF000000" } };
              worksheet.getCell(obsCellStart).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
              
              let currentImgRow = 90;
              if (isTalleres) currentImgRow = 50;
              else if (isCampamento) currentImgRow = 65;
              else if (isInstalacionesElectricas) currentImgRow = 54;
              else if (isCocinaComedor) currentImgRow = 61;
              else if (isLaboratorio) currentImgRow = 44;
              
              const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));
              let evidenciasMapLocal = {};
              if (data.evidenciaLevantamiento && data.evidenciaLevantamiento.startsWith('{')) {
                  try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
              }
              
              badItemsKeys.forEach((item) => {
                  const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                  if (photos && photos.length > 0) {
                      try { worksheet.mergeCells("B" + currentImgRow + ":G" + currentImgRow); } catch(e){}
                      worksheet.getCell("B" + currentImgRow).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                      worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 12 };
                      worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      
                      if (data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                          try { worksheet.mergeCells("H" + currentImgRow + ":L" + currentImgRow); } catch(e){}
                          worksheet.getCell("H" + currentImgRow).value = "EVIDENCIA DEL LEVANTAMIENTO";
                          worksheet.getCell("H" + currentImgRow).font = { bold: true, size: 12 };
                          worksheet.getCell("H" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      }
                      currentImgRow += 2;
                      
                      try {
                          const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                          let img1 = null; let imgLev = null;
                          if (photos[0] && typeof photos[0] === 'string' && photos[0].length > 50) img1 = stripB64(photos[0]);
                          if (evidenciasMapLocal[item] && typeof evidenciasMapLocal[item] === 'string' && evidenciasMapLocal[item].length > 50) imgLev = stripB64(evidenciasMapLocal[item]);
                          
                          if (img1) {
                              const imageId1 = workbook.addImage({ base64: img1, extension: "jpeg" });
                              worksheet.addImage(imageId1, { tl: { col: 1, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                          }
                          if (imgLev) {
                              const imageId2 = workbook.addImage({ base64: imgLev, extension: "jpeg" });
                              worksheet.addImage(imageId2, { tl: { col: 7, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                          }
                      } catch (e) {}
                      currentImgRow += 13;
                  }
              });
              
              let isSingleLevantamiento = false;
              if (data.evidenciaLevantamiento && !data.evidenciaLevantamiento.startsWith('{')) {
                  isSingleLevantamiento = true;
              }
              const checkIsLevantado = (itemKey) => {
                  if (isSingleLevantamiento) return true;
                  const match = Object.entries(evidenciasMapLocal).find(([k,v]) => k.startsWith(itemKey) && v && v.length > 50);
                  return !!match;
              };
              
              const occurrenceTracker = {};
              worksheet.eachRow((row, rowNum) => {
                  const seenInRow = new Set();
                  row.eachCell((cell, colNum) => {
                      if (typeof cell.value === 'string') {
                          const cellText = cell.value.trim().replace(/\\s+/g, ' ');
                          if (!seenInRow.has(cellText)) {
                              seenInRow.add(cellText);
                              occurrenceTracker[cellText] = (occurrenceTracker[cellText] || 0) + 1;
                          }
                          const expectedKey = cellText + '\\u200B'.repeat(occurrenceTracker[cellText] - 1);
                          if (checklist[expectedKey]) {
                              const matchKey = expectedKey;
                              let val = checklist[matchKey];
                              let isLevantado = false;
                              if ((val === 'NC' || val === 'X') && checkIsLevantado(matchKey)) {
                                  isLevantado = true;
                              }
                              if (val === 'OK' || val === 'C' || isLevantado) worksheet.getCell(rowNum, 11).value = 'x';
                              if (val === 'NC' || val === 'X') worksheet.getCell(rowNum, 12).value = 'x';
                              if (val === 'N/A') worksheet.getCell(rowNum, 13).value = 'x';
                          }
                      }
                  });
              });
          }
      }
`;

c = c.replace(/\/\/ --- MANEJADOR 5: INSPECCIONES DIGITALES GENÉRICAS/, code + "\n      // --- MANEJADOR 6: INSPECCIONES DIGITALES GENÉRICAS");

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Successfully rebuilt Manejador 5 safely!");
