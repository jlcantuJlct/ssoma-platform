const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /let moduleName = data\.moduleName \|\| data\.module_name \|\| "";/g,
    `let moduleName = data.moduleName || data.module_name || "";\n    if (moduleName === "InstalacionesElectricas") moduleName = "instalaciones eléctricas";`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed Instalaciones Eléctricas template mapping');
