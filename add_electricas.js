const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// First add `const isElectricas = normName.includes('electrica') || normName.includes('eléctrica');`
const constBlock = /const isCampamento = normName\.includes\('campamento'\);/g;
code = code.replace(constBlock, `const isCampamento = normName.includes('campamento');\n        const isElectricas = normName.includes('electrica') || normName.includes('eléctrica');`);

// Extract isCampamento block text
const startStr = "                else if (isCampamento) {";
const endStr = "                else {\n                    // Lógica para Extintores, Botiquines u otros módulos antiguos que no usan digital-form genérico";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find isCampamento block");
    process.exit(1);
}

let campamentoBlock = code.substring(startIndex, endIndex);

let electricasBlock = campamentoBlock.replace("else if (isCampamento)", "else if (isElectricas)");
// Replace observations row
electricasBlock = electricasBlock.replace(/'A57'/g, "'A47'");
electricasBlock = electricasBlock.replace(/for \(let r = 57; r <= 62; r\+\+\)/g, "for (let r = 47; r <= 52; r++)");
electricasBlock = electricasBlock.replace(/getRow\(57\)/g, "getRow(47)");

// Replace title rows
electricasBlock = electricasBlock.replace(/\[23, 36, 45, 50\]/g, "[14, 26, 36]");

// Replace grid boundaries
electricasBlock = electricasBlock.replace(/r <= 54; r\+\+/g, "r <= 44; r++");

// Replace photo start row
electricasBlock = electricasBlock.replace(/photoStartRow = 65;/g, "photoStartRow = 55;");

// Replace template name assumption in code if there is any... wait, we use fs.existsSync(templatePath).
// Make sure `else if (isElectricas)` comes before `else if (isCampamento)` or after it.
// I will insert it BEFORE `else if (isCampamento)`.

const newCode = code.substring(0, startIndex) + electricasBlock + "\n" + code.substring(startIndex);
fs.writeFileSync(path, newCode);
console.log("Added isElectricas logic block!");
