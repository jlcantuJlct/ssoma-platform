const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /const isInstalacionesElectricas = data\.isInstalacionesElectricasMatrix \|\| \(moduleName && moduleName\.toLowerCase\(\)\.includes\('eléctrica'\) \|\| moduleName && moduleName\.toLowerCase\(\)\.includes\('electrica'\)\);/g,
    `const isInstalacionesElectricas = data.isInstalacionesElectricasMatrix || (moduleName && moduleName.toLowerCase().includes('eléctrica') || moduleName && moduleName.toLowerCase().includes('electrica'));\n      const isCocinaComedor = data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes('cocina') || moduleName.toLowerCase().includes('comedor')));`
);

c = c.replace(
    /if \(data\.isInstalacionesElectricasMatrix \|\| \(moduleName && \(moduleName\.toLowerCase\(\)\.includes\("eléctrica"\) \|\| moduleName\.toLowerCase\(\)\.includes\("electrica"\)\)\)\) \{[\s\S]*?if \(fs\.existsSync\(alt1\)\) templatePath = alt1;\n      \}/m,
    `if (data.isInstalacionesElectricasMatrix || (moduleName && (moduleName.toLowerCase().includes("eléctrica") || moduleName.toLowerCase().includes("electrica")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspección de instalaciones eléctricas.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }
      
      if (data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes("cocina") || moduleName.toLowerCase().includes("comedor")))) {
        const alt1 = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de cocina y comedor.xlsx");
        if (fs.existsSync(alt1)) templatePath = alt1;
      }`
);

c = c.replace(
    /else if \(isAlmacen \|\| isTalleres \|\| isCampamento \|\| isInstalacionesElectricas\) \{/g,
    `else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor) {`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added isCocinaComedor boolean and fallback template path');
