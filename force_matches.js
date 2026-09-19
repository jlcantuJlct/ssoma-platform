const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// The line is: const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');
// We will add manual fallbacks for rows 28, 30, 31 just in case
const searchStr = `                            const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');\n                            if (!matchedRows.has(r) && (bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean))))) {`;

const replaceStr = `                            const tClean = normText.replace(/[^a-zA-Z0-9]/g, '');\n                            let forceMatch = false;\n                            if (r === 28 && tClean.includes('lasextensioneselectricasprovisionales')) forceMatch = true;\n                            if (r === 30 && tClean.includes('instalacioneselectricasapruebadeexplosion')) forceMatch = true;\n                            if (r === 31 && tClean.includes('todaextensionelectricatemporal')) forceMatch = true;\n                            if (!matchedRows.has(r) && (forceMatch || bClean === tClean || (bClean.length > 20 && (tClean.includes(bClean) || bClean.includes(tClean))))) {`;

// Replace ONLY in isElectricas block!
const startElectricas = code.indexOf('else if (isElectricas)');
const endElectricas = code.indexOf('else if (isCampamento)');

let block = code.substring(startElectricas, endElectricas);
block = block.replace(searchStr, replaceStr);

fs.writeFileSync(path, code.substring(0, startElectricas) + block + code.substring(endElectricas));
console.log("Patched forced matches for 28, 30, 31!");
