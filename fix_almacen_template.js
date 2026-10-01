const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `      if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {
        const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
        if (fs.existsSync(alt)) templatePath = alt;
      }`;

const rep = `      if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {
        const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
        if (fs.existsSync(alt)) templatePath = alt;
      }
      
      if (data.isAlmacenMatrix || (moduleName && (moduleName.toLowerCase().includes("almacen") || moduleName.toLowerCase().includes("almacén")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén .xlsx");
        const alt2 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacenes.xlsx");
        const alt3 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Almacén.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
        else if (fs.existsSync(alt2)) templatePath = alt2;
        else if (fs.existsSync(alt3)) templatePath = alt3;
      }`;

c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed templatePath for Almacen');
