const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `    const isTalleres =
      data.isTalleresMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("taller") ||
          moduleName.toLowerCase().includes("talleres")));`;

const rep1 = `    const isTalleres =
      data.isTalleresMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("taller") ||
          moduleName.toLowerCase().includes("talleres")));
          
    const isCampamento =
      data.isCampamentoMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("campamento") ||
          moduleName.toLowerCase().includes("campamentos")));`;

c = c.replace(target1, rep1);

const target2 = `      if (data.isTalleresMatrix || (moduleName && (moduleName.toLowerCase().includes("taller") || moduleName.toLowerCase().includes("talleres")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Talleres.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`;

const rep2 = `      if (data.isTalleresMatrix || (moduleName && (moduleName.toLowerCase().includes("taller") || moduleName.toLowerCase().includes("talleres")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Talleres.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }
      
      if (data.isCampamentoMatrix || (moduleName && (moduleName.toLowerCase().includes("campamento") || moduleName.toLowerCase().includes("campamentos")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de campamento.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`;

c = c.replace(target2, rep2);

const target3 = `      else if (isAlmacen || isTalleres) {`;
const rep3 = `      else if (isAlmacen || isTalleres || isCampamento) {`;
c = c.replace(target3, rep3);

const target4 = `            worksheet.getCell("D4").value = meta.proyecto || "RED VIAL 6";
            worksheet.getCell("D5").value = meta.area || "";
            worksheet.getCell("K5").value = meta.fecha || new Date().toISOString().split("T")[0];
            worksheet.getCell("D6").value = meta.inspector || "";
            worksheet.getCell("D7").value = meta.cargo || "";
            worksheet.getCell("D8").value = meta.responsable || "";`;

const rep4 = `            if (isCampamento) {
                worksheet.getCell("C4").value = meta.proyecto || "RED VIAL 6";
                worksheet.getCell("E5").value = meta.area || "";
                worksheet.getCell("K5").value = meta.fecha || new Date().toISOString().split("T")[0];
                worksheet.getCell("D6").value = meta.inspector || "";
                worksheet.getCell("D7").value = meta.cargo || "";
                worksheet.getCell("D8").value = meta.responsable || "";
            } else {
                worksheet.getCell("D4").value = meta.proyecto || "RED VIAL 6";
                worksheet.getCell("D5").value = meta.area || "";
                worksheet.getCell("K5").value = meta.fecha || new Date().toISOString().split("T")[0];
                worksheet.getCell("D6").value = meta.inspector || "";
                worksheet.getCell("D7").value = meta.cargo || "";
                worksheet.getCell("D8").value = meta.responsable || "";
            }`;
c = c.replace(target4, rep4);

const target5 = `            const obsCellStart = isTalleres ? "A39" : "A83";
            const obsCellEnd = isTalleres ? "M44" : "L86";`;
const rep5 = `            let obsCellStart = "A83";
            let obsCellEnd = "L86";
            if (isTalleres) {
                obsCellStart = "A39";
                obsCellEnd = "M44";
            } else if (isCampamento) {
                obsCellStart = "A57";
                obsCellEnd = "M61";
            }`;
c = c.replace(target5, rep5);

const target6 = `            let currentImgRow = isTalleres ? 50 : 90;`;
const rep6 = `            let currentImgRow = 90;
            if (isTalleres) currentImgRow = 50;
            else if (isCampamento) currentImgRow = 65;`;
c = c.replace(target6, rep6);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Campamento backend export logic added successfully');
