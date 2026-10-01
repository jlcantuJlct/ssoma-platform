const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Issue 2: Fix Observaciones cell start for Talleres
const obsTarget = `            const obsCellStart = isTalleres ? "A38" : "A83";
            const obsCellEnd = isTalleres ? "M42" : "L86";`;
const obsRep = `            const obsCellStart = isTalleres ? "A39" : "A83";
            const obsCellEnd = isTalleres ? "M44" : "L86";`;
c = c.replace(obsTarget, obsRep);

// Issue 1: Fix image size and spacing
const imgTarget1 = `                        const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                        worksheet.addImage(imageId, { tl: { col: 1, row: currentImgRow }, ext: { width: 300, height: 300 } });`;
const imgRep1 = `                        const imageId = workbook.addImage({ base64: stripB64(photos[0]), extension: "png" });
                        worksheet.addImage(imageId, { tl: { col: 1, row: currentImgRow }, ext: { width: 250, height: 250 } });`;
c = c.replace(imgTarget1, imgRep1);

const imgTarget2 = `                        if (specificEvidencia) {
                            const evId = workbook.addImage({ base64: stripB64(specificEvidencia), extension: "png" });
                            worksheet.addImage(evId, { tl: { col: 7, row: currentImgRow }, ext: { width: 300, height: 300 } });
                        }`;
const imgRep2 = `                        if (specificEvidencia) {
                            const evId = workbook.addImage({ base64: stripB64(specificEvidencia), extension: "png" });
                            worksheet.addImage(evId, { tl: { col: 7, row: currentImgRow }, ext: { width: 250, height: 250 } });
                        }`;
c = c.replace(imgTarget2, imgRep2);

const rowTarget = `                    currentImgRow += 16;`;
const rowRep = `                    currentImgRow += 18;`;
c = c.replace(rowTarget, rowRep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export-excel issues 1 and 2');
