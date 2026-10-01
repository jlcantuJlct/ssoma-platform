const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /if \(data\.isCampamentoMatrix \|\| \(moduleName && \(moduleName\.toLowerCase\(\)\.includes\("campamento"\) \|\| moduleName\.toLowerCase\(\)\.includes\("campamentos"\)\)\)\) \{[\s\S]*?if \(fs\.existsSync\(alt1\)\) templatePath = alt1;\s*\}/m,
    `if (data.isCampamentoMatrix || (moduleName && (moduleName.toLowerCase().includes("campamento") || moduleName.toLowerCase().includes("campamentos")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de campamento.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }
      
      if (data.isInstalacionesElectricasMatrix || (moduleName && (moduleName.toLowerCase().includes("eléctrica") || moduleName.toLowerCase().includes("electrica")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de instalaciones eléctricas.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed Instalaciones Eléctricas templatePath fallback');
