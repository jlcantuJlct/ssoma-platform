const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = 'if (!hasPhotos) worksheet.getCell(`A65`).value = "";';
if (code.includes(target) && !code.includes('throw new Error("La plantilla \'Inspección de campamento.xlsx\'')) {
    code = code.replace(
        target,
        target + '\n            } else {\n                throw new Error("La plantilla \'Inspección de campamento.xlsx\' no se encuentra.");\n            }\n        }'
    );
    fs.writeFileSync(path, code);
    console.log("Braces fixed!");
} else {
    console.log("Already fixed or not found.");
}
