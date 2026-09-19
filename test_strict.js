const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const worksheet = wb.worksheets[0];
    
    const items = [
        "Áreas de tránsito con iluminación adecuada y operativa",
        "Dispositivos de iluminación siempre limpios",
        "Iluminación de emergencia operativa"
    ];
    
    for (const text of items) {
        const normText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let targetRow = -1;
        for (let r = 14; r <= 54; r++) {
            let cellB = worksheet.getCell(`B${r}`).value;
            if (cellB && typeof cellB === 'object' && cellB.richText) cellB = cellB.richText.map((t) => t.text).join('');
            if (cellB) {
                const bNorm = cellB.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const bClean = bNorm.replace(/[^a-zA-Z0-9]/g, '');
                const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');
                // Strict match
                if (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean)))) {
                    targetRow = r;
                    break;
                }
            }
        }
        console.log(`Text: ${text.substring(0,30)} -> Row: ${targetRow}`);
    }
}
run();
