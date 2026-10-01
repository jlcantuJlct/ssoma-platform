const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const targetLoop = `badItemsKeys.forEach((item) => {
                    const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                    if (photos && photos.length > 0) {
                        try {
                            const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                            const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                            worksheet.addImage(imageId, {
                                tl: { col: 1, row: currentImgRow + 1 },
                                ext: { width: 300, height: 300 }
                            });
                            
                            if (data.evidenciaLevantamiento) {
                                const evId = workbook.addImage({ base64: stripB64(data.evidenciaLevantamiento), extension: "png" });
                                worksheet.addImage(evId, {
                                    tl: { col: 14, row: currentImgRow + 1 },
                                    ext: { width: 300, height: 300 }
                                });
                            }
                        } catch(e) {}
                        
                        currentImgRow += 16;
                    }
                });`;

const newLoop = `let evidenciasMap = {};
                if (data.evidenciaLevantamiento && data.evidenciaLevantamiento.startsWith('{')) {
                    try { evidenciasMap = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
                }

                badItemsKeys.forEach((item) => {
                    const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                    if (photos && photos.length > 0) {
                        try {
                            const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                            const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                            worksheet.addImage(imageId, {
                                tl: { col: 1, row: currentImgRow + 1 },
                                ext: { width: 300, height: 300 }
                            });
                            
                            const specificEvidencia = Object.entries(evidenciasMap).find(([k,v]) => k.startsWith(item))?.[1] || 
                                (!data.evidenciaLevantamiento?.startsWith('{') ? data.evidenciaLevantamiento : null);

                            if (specificEvidencia) {
                                const evId = workbook.addImage({ base64: stripB64(specificEvidencia), extension: "png" });
                                worksheet.addImage(evId, {
                                    tl: { col: 14, row: currentImgRow + 1 },
                                    ext: { width: 300, height: 300 }
                                });
                            }
                        } catch(e) {}
                        
                        currentImgRow += 16;
                    }
                });`;

c = c.replace(targetLoop, newLoop);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Updated export-excel to parse multiple photos');
