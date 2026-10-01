const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `    const isAlmacen =
      data.isAlmacenMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("almacen") ||
          moduleName.toLowerCase().includes("almacén")));`;

const rep1 = `    const isAlmacen =
      data.isAlmacenMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("almacen") ||
          moduleName.toLowerCase().includes("almacén")));
          
    const isTalleres =
      data.isTalleresMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("taller") ||
          moduleName.toLowerCase().includes("talleres")));`;

c = c.replace(target1, rep1);

const target2 = `      if (data.isAlmacenMatrix || (moduleName && (moduleName.toLowerCase().includes("almacen") || moduleName.toLowerCase().includes("almacén")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén .xlsx");
        const alt2 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacenes.xlsx");
        const alt3 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
        else if (fs.existsSync(alt2)) templatePath = alt2;
        else if (fs.existsSync(alt3)) templatePath = alt3;
      }`;

const rep2 = `      if (data.isAlmacenMatrix || (moduleName && (moduleName.toLowerCase().includes("almacen") || moduleName.toLowerCase().includes("almacén")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén .xlsx");
        const alt2 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacenes.xlsx");
        const alt3 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
        else if (fs.existsSync(alt2)) templatePath = alt2;
        else if (fs.existsSync(alt3)) templatePath = alt3;
      }
      
      if (isTalleres) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Talleres.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`;

c = c.replace(target2, rep2);

const target3 = `      else if (isAlmacen) {`;
const rep3 = `      else if (isAlmacen || isTalleres) {`;
c = c.replace(target3, rep3);

const target4 = `            let currentImgRow = 90;
            const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));`;
const rep4 = `            let currentImgRow = isTalleres ? 50 : 90;
            const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));`;
c = c.replace(target4, rep4);

// For merged cells on Observaciones: Talleres starts at A38 instead of A83
const target5 = `            // Observaciones
            const observaciones = data.observaciones || meta.observaciones || "";
            try { worksheet.mergeCells("A83:L86"); } catch(e) {}
            worksheet.getCell("A83").value = observaciones;
            worksheet.getCell("A83").alignment = { wrapText: true, vertical: "top" };`;
const rep5 = `            // Observaciones
            const observaciones = data.observaciones || meta.observaciones || "";
            const obsCellStart = isTalleres ? "A38" : "A83";
            const obsCellEnd = isTalleres ? "M42" : "L86";
            try { worksheet.mergeCells(\`\${obsCellStart}:\${obsCellEnd}\`); } catch(e) {}
            worksheet.getCell(obsCellStart).value = observaciones;
            worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };`;
c = c.replace(target5, rep5);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Talleres configured in export-excel');
