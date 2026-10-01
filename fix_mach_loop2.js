const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const markerStart = "// Mapeo dinámico de items (con prevención de duplicados en la misma fila debido a celdas combinadas)";
const markerEnd = "worksheet.getCell(\"A79\").value = observaciones;";

const startIdx = c.indexOf(markerStart);
const endIdx = c.indexOf(markerEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const newLoop = `// Mapeo dinámico de items (con prevención de duplicados cruzados entre máquinas y celdas combinadas)
            const tipo = (meta.tipoEquipo || "").toUpperCase();
            const isAllowedCell = (r, c) => {
                if (c >= 1 && c <= 7 && r < 50) return true;
                if (tipo.includes("TRACTOR") || tipo.includes("MOTONIVELADORA") || tipo.includes("RODILLO") || tipo.includes("PAVIMENTADORA")) {
                    if (c >= 10 && c <= 16) return true;
                }
                if (tipo.includes("EXCAVADORA") || tipo.includes("RETRO") || tipo.includes("FRESADORA")) {
                    if (c >= 19 && c <= 25) return true;
                }
                if (tipo.includes("CARGADOR") || tipo.includes("MINICARGADOR")) {
                    if (c >= 1 && c <= 7 && r >= 50) return true;
                }
                return false;
            };

            let rowProcessed = {};
            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                    if (!isAllowedCell(rowNum, colNum)) return;
                    
                    const text = (cell.value && typeof cell.value === 'object' && cell.value.richText) 
                        ? cell.value.richText.map(rt => rt.text).join('') 
                        : String(cell.value || '');
                    
                    const cleanText = text.trim();
                    if (checklist[cleanText] && !rowProcessed[rowNum + "_" + cleanText]) {
                        rowProcessed[rowNum + "_" + cleanText] = true;
                        const val = checklist[cleanText];
                        const offset = getOffset(cleanText, val);
                        if (offset !== null) {
                            worksheet.getCell(rowNum, colNum + offset).value = "x";
                            worksheet.getCell(rowNum, colNum + offset).font = { bold: true };
                            worksheet.getCell(rowNum, colNum + offset).alignment = { horizontal: "center", vertical: "middle" };
                        }
                    }
                });
            });

            `;
    
    c = c.substring(0, startIdx) + newLoop + c.substring(endIdx);
    fs.writeFileSync('app/api/export-excel/route.ts', c);
    console.log("Successfully replaced loop using slice");
} else {
    console.log("Could not find markers!");
}
