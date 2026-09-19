const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Insert isLaboratorio boolean
if (!code.includes('const isLaboratorio = normName.includes(\'laboratorio\')')) {
    code = code.replace(/const isElectricas = /g, 
        `const isLaboratorio = normName.includes('laboratorio');\n        const isElectricas = `);
}

// Copy isElectricas block
const startStr = "else if (isElectricas) {";
const startIndex = code.indexOf(startStr);
const endStr = "else if (isCampamento) {";
const endIndex = code.indexOf(endStr);

let block = code.substring(startIndex, endIndex);

// Replace isElectricas to isLaboratorio
block = block.replace("else if (isElectricas)", "else if (isLaboratorio)");

// Adjust area cell: E5 -> D5
block = block.replace(/worksheet\.getCell\('E5'\)\.value = area;/g, "worksheet.getCell('D5').value = area;");

// Adjust observation row: A47 -> A35
block = block.replace(/A47/g, 'A35');
block = block.replace(/getRow\(47\)/g, 'getRow(35)');
block = block.replace(/for \(let r = 47; r <= 52; r\+\+\)/g, 'for (let r = 35; r <= 40; r++)'); // observations block
block = block.replace(/worksheet\.getCell\(\`A53\`\)/g, 'worksheet.getCell(`A43`)');
block = block.replace(/currentPhotoRow = 53/g, 'currentPhotoRow = 43');

// Adjust grid: rows 15 to 33
block = block.replace(/for \(let r = 15; r <= 44; r\+\+\)/g, 'for (let r = 15; r <= 33; r++)');

// Remove white font coloring loop
block = block.replace(/\/\/ Color títulos en blanco[\s\S]*?\}\);/g, '');

// Remove the force match logic (we don't need it for this, hopefully, or we can just leave it since the condition `r === 28` won't match the same string).
block = block.replace(/let forceMatch = false;[\s\S]*?forceMatch = true;/g, 'let forceMatch = false;');

// Replace error text
block = block.replace(/Inspección de instalaciones eléctricas/g, 'Inspección de Laboratorio');

const newCode = code.substring(0, startIndex) + block + "\n        " + code.substring(startIndex);
fs.writeFileSync(path, newCode);
console.log("Laboratorio logic injected!");
