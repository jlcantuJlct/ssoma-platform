const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const checkmarksTarget = `            // Checkmarks
            worksheet.eachRow((row, rowNum) => {
                row.eachCell((cell, colNum) => {
                    if (typeof cell.value === 'string') {
                        const cellText = cell.value.trim().replace(/\s+/g, ' ');
                        const matchKey = Object.keys(checklist).find(k => k.replace(/[\u200B]/g, '').trim().replace(/\s+/g, ' ') === cellText);
                        if (matchKey) {
                            const val = checklist[matchKey];
                            if (val === 'C') worksheet.getCell(rowNum, 11).value = 'X';
                            if (val === 'NC') worksheet.getCell(rowNum, 12).value = 'X';
                            if (val === 'N/A') worksheet.getCell(rowNum, 13).value = 'X';
                        }
                    }
                });
            });`;

const checkmarksRep = `            // Parse evidenciasMap first for levantamiento logic
            let evidenciasMapLocal = {};
            let isSingleLevantamiento = false;
            if (data.evidenciaLevantamiento && typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
            } else if (data.evidenciaLevantamiento && typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
                isSingleLevantamiento = true;
            }

            const checkIsLevantado = (itemKey) => {
                if (isSingleLevantamiento) return true;
                const match = Object.entries(evidenciasMapLocal).find(([k,v]) => k.startsWith(itemKey) && v && v.length > 50);
                return !!match;
            };

            const usedKeys = new Set();

            // Checkmarks
            worksheet.eachRow((row, rowNum) => {
                row.eachCell((cell, colNum) => {
                    if (typeof cell.value === 'string') {
                        const cellText = cell.value.trim().replace(/\s+/g, ' ');
                        const matchKey = Object.keys(checklist).find(k => 
                            k.replace(/[\\u200B]/g, '').trim().replace(/\\s+/g, ' ') === cellText && !usedKeys.has(k)
                        );
                        if (matchKey) {
                            usedKeys.add(matchKey);
                            let val = checklist[matchKey];
                            
                            // If item was NC but got levantado, mark as C in Excel
                            if (val === 'NC' && checkIsLevantado(matchKey)) {
                                val = 'C';
                            }
                            
                            if (val === 'C') worksheet.getCell(rowNum, 11).value = 'X';
                            if (val === 'NC') worksheet.getCell(rowNum, 12).value = 'X';
                            if (val === 'N/A') worksheet.getCell(rowNum, 13).value = 'X';
                        }
                    }
                });
            });`;

c = c.replace(checkmarksTarget, checkmarksRep);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed checkmarks logic');
