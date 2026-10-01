const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `const isEpp = data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"));`;
const newTarget1 = `const isEpp = data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"));
      const isAlmacen = data.isAlmacenMatrix || (moduleName && moduleName.toLowerCase().includes("almac"));`;
c = c.replace(target1, newTarget1);

const target2 = `let templatePath = path.join(process.cwd(), "public", "templates", "digital", "Extintores.xlsx");
      if (isBotiquin) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Botiquines.xlsx");
      } else if (isEpp) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Inspección de EPP.xlsx");
      } else if (isMachinery) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
      }`;
const newTarget2 = `let templatePath = path.join(process.cwd(), "public", "templates", "digital", "Extintores.xlsx");
      if (isBotiquin) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Botiquines.xlsx");
      } else if (isEpp) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Inspección de EPP.xlsx");
      } else if (isMachinery) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
      } else if (isAlmacen) {
        templatePath = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén .xlsx");
      }`;
c = c.replace(target2, newTarget2);

const targetAlmacenBlock = `      // --- MANEJADOR 5: ALMACEN MATRICIAL ---
      else if (isAlmacen) {
        const meta = data.meta || data.answers || {};
        const checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});

        if (fs.existsSync(templatePath)) {
            // Logo
            try {
                const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
                if (fs.existsSync(logoPath)) {
                    const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
                    worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
                }
            } catch(e) {}

            // Header data
            worksheet.getCell("D4").value = meta.proyecto || "RED VIAL 6";
            worksheet.getCell("D5").value = meta.area || "";
            worksheet.getCell("K5").value = meta.fecha || new Date().toISOString().split("T")[0];
            worksheet.getCell("D6").value = meta.inspector || "";
            worksheet.getCell("D7").value = meta.cargo || "";
            worksheet.getCell("D8").value = meta.responsable || "";

            // Checkmarks
            worksheet.eachRow((row, rowNum) => {
                row.eachCell((cell, colNum) => {
                    if (typeof cell.value === 'string') {
                        const cleanText = cell.value.trim();
                        if (checklist[cleanText]) {
                            const val = checklist[cleanText];
                            let offset = null;
                            if (val === 'OK') offset = 10; // K
                            else if (val === 'X') offset = 11; // L
                            else if (val === 'N/A') offset = 12; // M
                            
                            if (offset !== null) {
                                // Since the text is in col C (3), D (4) etc. wait, if the question is at C2 (colNum=2)
                                // Then C(11) is colNum + (11-2) = +9.
                                // Wait, the question is merged from C2 to C10, so it lives in C2 (colNum=2)
                                // K is col 11. So colNum=2 -> col 11 means offset is 9, 10, 11
                                // Let's just use absolute columns for the marks!
                                if (val === 'OK') worksheet.getCell(rowNum, 11).value = "x";
                                else if (val === 'X') worksheet.getCell(rowNum, 12).value = "x";
                                else if (val === 'N/A') worksheet.getCell(rowNum, 13).value = "x";
                            }
                        }
                    }
                });
            });

            // Signatures
            const firmas = data.firmas || meta.firmas || {};
            if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                try {
                    const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                    const imageId = workbook.addImage({ base64: stripB64(firmas.inspectorFirma), extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 10, row: 5 }, ext: { width: 140, height: 40 } }); // K6
                } catch(e) { console.error("Error firma insp almacen:", e); }
            }
            if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                try {
                    const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                    const imageId = workbook.addImage({ base64: stripB64(firmas.responsableFirma), extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 10, row: 7 }, ext: { width: 140, height: 40 } }); // K8
                } catch(e) { console.error("Error firma resp almacen:", e); }
            }

            // Observaciones
            const observaciones = data.observaciones || meta.observaciones || "";
            try { worksheet.mergeCells("A83:L86"); } catch(e) {}
            worksheet.getCell("A83").value = observaciones;
            worksheet.getCell("A83").alignment = { wrapText: true, vertical: "top" };

            // Evidencias Fotográficas
            let currentImgRow = 90;
            const badItemsKeys = Object.keys(checklist).filter(k => ['X'].includes(checklist[k]));
            
            let evidenciasMap = {};
            if (data.evidenciaLevantamiento && data.evidenciaLevantamiento.startsWith('{')) {
                try { evidenciasMap = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
            }

            badItemsKeys.forEach((item) => {
                const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                if (photos && photos.length > 0) {
                    worksheet.getCell(\`B\${currentImgRow}\`).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                    worksheet.getCell(\`B\${currentImgRow}\`).font = { bold: true, size: 12 };
                    
                    if (data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                        worksheet.getCell(\`H\${currentImgRow}\`).value = "EVIDENCIA DEL LEVANTAMIENTO";
                        worksheet.getCell(\`H\${currentImgRow}\`).font = { bold: true, size: 12 };
                    }
                    currentImgRow += 2;

                    try {
                        const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                        const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                        worksheet.addImage(imageId, { tl: { col: 1, row: currentImgRow }, ext: { width: 300, height: 300 } });
                        
                        const specificEvidencia = Object.entries(evidenciasMap).find(([k,v]) => k.startsWith(item))?.[1] || 
                            (!data.evidenciaLevantamiento?.startsWith('{') ? data.evidenciaLevantamiento : null);

                        if (specificEvidencia) {
                            const evId = workbook.addImage({ base64: stripB64(specificEvidencia), extension: "png" });
                            worksheet.addImage(evId, { tl: { col: 7, row: currentImgRow }, ext: { width: 300, height: 300 } });
                        }
                    } catch(e) {}
                    
                    currentImgRow += 16;
                }
            });
        }
      }`;

const insertionPoint = `      // --- MANEJADOR 4: MAQUINARIA MATRICIAL ---`;
c = c.replace(insertionPoint, targetAlmacenBlock + '\n\n' + insertionPoint);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added Almacen export logic');
