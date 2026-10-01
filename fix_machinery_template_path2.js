const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const s1 = '        } else if (data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"))) {';
const s2 = '          if (fs.existsSync(alt)) templatePath = alt;\n        }';

const idx1 = c.indexOf(s1);
if (idx1 !== -1) {
    const endStr = '          if (fs.existsSync(alt)) templatePath = alt;\n        }';
    const idx2 = c.indexOf(endStr, idx1);
    if (idx2 !== -1) {
        const insertPos = idx2 + endStr.length;
        const insertStr = ` else if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria") || moduleName.toLowerCase().includes("máquina") || moduleName.toLowerCase().includes("maquina"))) {
          const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
          if (fs.existsSync(alt)) templatePath = alt;
        }`;
        c = c.substring(0, insertPos) + insertStr + c.substring(insertPos);
        fs.writeFileSync('app/api/export-excel/route.ts', c);
        console.log('Added templatePath for Machinery');
    }
}
