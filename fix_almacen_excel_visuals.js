const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Fix 1: Add worksheet.getCell("A1").value = ""; to Almacen logo insertion
const target1 = `            // Logo
            try {
                const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");`;
const rep1 = `            // Logo
            worksheet.getCell("A1").value = "";
            try {
                const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");`;
c = c.replace(target1, rep1);

// Fix 2: Merge cells for the evidence titles
const target2 = `                    worksheet.getCell(\`B\${currentImgRow}\`).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                    worksheet.getCell(\`B\${currentImgRow}\`).font = { bold: true, size: 12 };
                    
                    if (data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                        worksheet.getCell(\`H\${currentImgRow}\`).value = "EVIDENCIA DEL LEVANTAMIENTO";
                        worksheet.getCell(\`H\${currentImgRow}\`).font = { bold: true, size: 12 };
                    }`;

const rep2 = `                    try { worksheet.mergeCells(\`B\${currentImgRow}:G\${currentImgRow}\`); } catch(e){}
                    worksheet.getCell(\`B\${currentImgRow}\`).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                    worksheet.getCell(\`B\${currentImgRow}\`).font = { bold: true, size: 12 };
                    worksheet.getCell(\`B\${currentImgRow}\`).alignment = { wrapText: true, vertical: 'middle' };
                    
                    if (data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                        try { worksheet.mergeCells(\`H\${currentImgRow}:L\${currentImgRow}\`); } catch(e){}
                        worksheet.getCell(\`H\${currentImgRow}\`).value = "EVIDENCIA DEL LEVANTAMIENTO";
                        worksheet.getCell(\`H\${currentImgRow}\`).font = { bold: true, size: 12 };
                        worksheet.getCell(\`H\${currentImgRow}\`).alignment = { wrapText: true, vertical: 'middle' };
                    }`;

c = c.replace(target2, rep2);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed A1 logo value and merged cells for photo headers in Almacen');
