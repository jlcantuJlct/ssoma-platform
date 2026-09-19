const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Insert the const definition if not present
if (!code.includes('const isElectricas = normName.includes(\'electrica\')')) {
    code = code.replace(/const isCampamento = normName\.includes\('campamento'\);/g, 
        `const isCampamento = normName.includes('campamento');\n        const isElectricas = normName.includes('electrica') || normName.includes('eléctrica');`);
}

// Find isCampamento block
const startStr = "else if (isCampamento) {";
const startIndex = code.indexOf(startStr);

// Find end of isCampamento block (which is before "else { // Si no tiene plantilla física")
const endStr = `        else {\n            // Si no tiene plantilla física`;
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    let campamentoBlock = code.substring(startIndex, endIndex);

    // Duplicate and replace
    let electricasBlock = campamentoBlock.replace("else if (isCampamento)", "else if (isElectricas)");
    
    // Rows logic
    electricasBlock = electricasBlock.replace(/'A57'/g, "'A47'");
    electricasBlock = electricasBlock.replace(/for \(let r = 57; r <= 62; r\+\+\)/g, "for (let r = 47; r <= 52; r++)");
    electricasBlock = electricasBlock.replace(/getRow\(57\)/g, "getRow(47)");
    electricasBlock = electricasBlock.replace(/\[23, 36, 45, 50\]/g, "[14, 26, 36]");
    electricasBlock = electricasBlock.replace(/r <= 54; r\+\+/g, "r <= 44; r++");
    electricasBlock = electricasBlock.replace(/photoStartRow = 65;/g, "photoStartRow = 55;");
    electricasBlock = electricasBlock.replace(/worksheet\.getCell\(\`A65\`\)/g, "worksheet.getCell(`A55`)");
    electricasBlock = electricasBlock.replace(/La plantilla 'Inspección de campamento\.xlsx' no se encuentra/g, "La plantilla 'Inspección de instalaciones eléctricas.xlsx' no se encuentra");

    // Insert BEFORE isCampamento
    const newCode = code.substring(0, startIndex) + electricasBlock + "\n        " + code.substring(startIndex);
    fs.writeFileSync(path, newCode);
    console.log("SUCCESS");
} else {
    console.log("NOT FOUND", startIndex, endIndex);
}
