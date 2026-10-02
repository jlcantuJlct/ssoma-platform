const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const isBotiquinRegex = /const isBotiquin = data\.isBotiquinesMatrix \|\| \(moduleName && \(moduleName\.toLowerCase\(\)\.includes\("botiquin"\) \|\| moduleName\.toLowerCase\(\)\.includes\("botiquín"\)\)\);/;
const newConstants = `const isBotiquin = data.isBotiquinesMatrix || (moduleName && (moduleName.toLowerCase().includes("botiquin") || moduleName.toLowerCase().includes("botiquín")));
    const isEstacionEmergencia = data.isEstacionEmergenciaMatrix || (moduleName && (moduleName.toLowerCase().includes("estacion") || moduleName.toLowerCase().includes("estación")));`;
code = code.replace(isBotiquinRegex, newConstants);

const fallbackRegex = /if \(isBotiquin\) \{ const alt = path\.join\(process\.cwd\(\), "public", "templates", "digital", "Botiquines\.xlsx"\); if\(fs\.existsSync\(alt\)\) templatePath = alt; \}/;
const newFallback = `if (isBotiquin) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Botiquines.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isEstacionEmergencia) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de estación de primeros auxilios.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }`;
code = code.replace(fallbackRegex, newFallback);

const hugeIfRegex = /else if \(isAlmacen \|\| isTalleres \|\| isCampamento \|\| isInstalacionesElectricas \|\| isCocinaComedor \|\| isLaboratorio \|\| isBotiquin\) \{/;
const newHugeIf = `else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor || isLaboratorio || isBotiquin || isEstacionEmergencia) {`;
code = code.replace(hugeIfRegex, newHugeIf);

// Inside the HUGE block, we need to map the exact cells.
// For headers:
const botiquinHeadersRegex = /\} else if \(isBotiquin\) \{[\s\S]*?worksheet\.getCell\('D7'\)\.value = meta\.responsable \|\| '';/;
const estacionHeaders = `} else if (isBotiquin) {
                    worksheet.getCell('C4').value = meta.proyecto || 'RED VIAL 6';
                    worksheet.getCell('C5').value = meta.fecha || new Date().toISOString().split('T')[0];
                    worksheet.getCell('I5').value = meta.hora || '';
                    worksheet.getCell('D6').value = meta.inspector || '';
                    worksheet.getCell('D7').value = meta.responsable || '';
                } else if (isEstacionEmergencia) {
                    worksheet.getCell('C4').value = meta.proyecto || 'RED VIAL 6';
                    worksheet.getCell('C5').value = meta.fecha || new Date().toISOString().split('T')[0];
                    worksheet.getCell('I5').value = meta.hora || '';
                    worksheet.getCell('D6').value = meta.inspector || '';
                    worksheet.getCell('D7').value = meta.responsable || '';
                    worksheet.getCell('D8').value = meta.ubicacion || '';`;
code = code.replace(botiquinHeadersRegex, estacionHeaders);

// For item loop:
const botiquinLoopRegex = /else if \(isBotiquin\) \{[\s\S]*?return \{ row: 15 \+ i \};[\s\S]*?\}/;
const estacionLoop = `else if (isBotiquin) {
                    return { row: 15 + i };
                } else if (isEstacionEmergencia) {
                    return { row: 15 + i };
                }`;
code = code.replace(botiquinLoopRegex, estacionLoop);

const botiquinColsRegex = /else if \(isBotiquin\) \{\s*cCol = 'H'; ncCol = 'K'; naCol = 'L';\s*\}/;
const estacionCols = `else if (isBotiquin) {
                    cCol = 'H'; ncCol = 'K'; naCol = 'L';
                } else if (isEstacionEmergencia) {
                    cCol = 'K'; ncCol = 'L'; naCol = 'M';
                }`;
code = code.replace(botiquinColsRegex, estacionCols);

// For observaciones merge:
const obsMerge1 = /else if \(isBotiquin\) \{ obsCellStart = "A36"; obsCellEnd = "M42"; \}/g;
const newObsMerge1 = `else if (isBotiquin) { obsCellStart = "A36"; obsCellEnd = "M42"; } else if (isEstacionEmergencia) { obsCellStart = "A43"; obsCellEnd = "M47"; }`;
code = code.replace(obsMerge1, newObsMerge1);

const obsMerge2 = /else if \(isBotiquin\) \{ for\(let r=36; r<=42; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \} \}/g;
const newObsMerge2 = `else if (isBotiquin) { for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } } else if (isEstacionEmergencia) { for(let r=43; r<=47; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }`;
code = code.replace(obsMerge2, newObsMerge2);

const imgRow = /else if \(isBotiquin\) currentImgRow = 50;/g;
const newImgRow = `else if (isBotiquin) currentImgRow = 50; else if (isEstacionEmergencia) currentImgRow = 52;`;
code = code.replace(imgRow, newImgRow);

fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log("Patched export-excel for Estacion Emergencia");
