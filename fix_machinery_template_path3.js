const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace('if (fs.existsSync(alt)) templatePath = alt;\n        }\n      }\n      let workbook', 
'if (fs.existsSync(alt)) templatePath = alt;\n        } else if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {\n          const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");\n          if (fs.existsSync(alt)) templatePath = alt;\n        }\n      }\n      let workbook');

// wait, the line endings are CRLF!
c = c.replace(/if \(fs\.existsSync\(alt\)\) templatePath = alt;\r?\n        \}\r?\n      \}\r?\n      let workbook/,
'if (fs.existsSync(alt)) templatePath = alt;\n        } else if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {\n          const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");\n          if (fs.existsSync(alt)) templatePath = alt;\n        }\n      }\n      let workbook');

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added template path correctly');
