const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `const getAns = (label) => answers.find(a => a.text === label)?.text || '';`;
const replacement = `const getAns = (label) => answers.find(a => a.text === label)?.text || '';
            const razon = getAns('Razon:');
            const ruc = getAns('Ruc:');
            const domicilio = getAns('Domicilio:');
            const actividad = getAns('Actividad:');
            const trabajadores = getAns('Trabajadores:');
`;
if (!code.includes("const razon = getAns('Razon:');")) {
    code = code.replace(target, replacement);
}

const writeTarget = `worksheet.getCell('A7').value = proyecto;`;
const writeReplacement = `worksheet.getCell('A5').value = razon;
            worksheet.getCell('I5').value = ruc;
            worksheet.getCell('K5').value = domicilio;
            worksheet.getCell('P5').value = actividad;
            worksheet.getCell('T5').value = trabajadores;
            worksheet.getCell('A7').value = proyecto;`;
if (!code.includes("worksheet.getCell('A5').value = razon;")) {
    code = code.replace(writeTarget, writeReplacement);
}

fs.writeFileSync(path, code);
console.log("Excel Export updated!");
