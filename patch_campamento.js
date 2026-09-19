const fs = require('fs');

const routePath = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(routePath, 'utf8');

if (!code.includes('const isCampamento = normName.includes(\'campamento\');')) {
    code = code.replace(
        "const isTalleres = normName.includes('taller');",
        "const isTalleres = normName.includes('taller');\n        const isCampamento = normName.includes('campamento');"
    );
}

const talleresBlock = fs.readFileSync('talleres_block.txt', 'utf8');
let campBlock = talleresBlock
    .replace('else if (isTalleres) {', 'else if (isCampamento) {')
    .replace('Inspección de Talleres.xlsx', 'Inspección de campamento.xlsx')
    .replace("worksheet.getCell('D5').value = area;", "worksheet.getCell('E5').value = area;")
    .replace("worksheet.getCell('A10').value = 'X';", "worksheet.getCell('H10').value = 'X';")
    .replace("worksheet.getCell('A10').alignment", "worksheet.getCell('H10').alignment")
    .replace("worksheet.getCell('A11').value = 'X';", "worksheet.getCell('H11').value = 'X';")
    .replace("worksheet.getCell('A11').alignment", "worksheet.getCell('H11').alignment")
    .replace("worksheet.getCell('A12').value = 'X';", "worksheet.getCell('H12').value = 'X';")
    .replace("worksheet.getCell('A12').alignment", "worksheet.getCell('H12').alignment")
    .replace(/A39/g, 'A57')
    .replace(/r = 39; r <= 44/g, 'r = 57; r <= 62')
    .replace(/getRow\(39\)/g, 'getRow(57)')
    .replace(/r = 15; r <= 35/g, 'r = 15; r <= 54')
    .replace(/let currentPhotoRow = 47;/g, 'let currentPhotoRow = 65;')
    .replace(/A47/g, 'A65');

if (!code.includes('else if (isCampamento) {')) {
    const splitStr = "else {\n            // Si no tiene plantilla física";
    const parts = code.split(splitStr);
    code = parts[0] + campBlock + "\n        " + splitStr + parts[1];
    fs.writeFileSync(routePath, code);
    console.log("Patched successfully!");
} else {
    console.log("Already patched.");
}
