const ExcelJS = require('exceljs');
const fs = require('fs');

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const worksheet = wb.worksheets[0];
    
    const items = [
        "Exhibición de la Política del SIG en el proyecto",
        "Exhibición de las Políticas Específicas de Integridad en el proyecto",
        "Exhibición del IPERC en áreas comunes",
        "Señales de Seguridad"
    ];
    
    for (const text of items) {
        const normText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let targetRow = -1;
        for (let r = 14; r <= 54; r++) { // Usually 15..54, let's see 14
            let cellB = worksheet.getCell(`B${r}`).value;
            if (cellB && typeof cellB === 'object' && cellB.richText) cellB = cellB.richText.map((t) => t.text).join('');
            if (cellB) {
                const bNorm = cellB.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const bClean = bNorm.replace(/[^a-zA-Z0-9]/g, '');
                const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');
                if (bClean.length > 5 && (tClean.includes(bClean) || bClean.includes(tClean))) {
                    targetRow = r;
                    break;
                }
            }
        }
        console.log(`Text: ${text.substring(0,20)} -> Row: ${targetRow}`);
    }
}
run();
