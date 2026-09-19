const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const targetImageBlock = `if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // col 6 is G
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }`;

const newImageBlock = `if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // col 6 is G (Evidencia Inicial)
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                if (h.evidenciaLevantamiento) {
                    try {
                        const base64Data = h.evidenciaLevantamiento.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // col 8 is I (Evidencia Levantamiento), placed side by side with Evidencia Inicial
                        worksheet.addImage(imageId, { tl: { col: 8, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }`;

if (!code.includes('h.evidenciaLevantamiento')) {
    code = code.replace(targetImageBlock, newImageBlock);
    fs.writeFileSync(path, code);
    console.log("Export API updated for Levantamiento!");
} else {
    console.log("Already updated!");
}
