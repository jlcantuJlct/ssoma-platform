const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /\/\/ Checkmarks[\s\S]*?(?=\/\/ Observaciones|\/\/ Evidencias Fotográficas)/,
    `// Parse evidenciasMap first for levantamiento logic
            let evidenciasMapLocal = {};
            let isSingleLevantamiento = false;
            if (data.evidenciaLevantamiento && typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
            } else if (data.evidenciaLevantamiento && typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 10) {
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
                        const cellText = cell.value.trim().replace(/\\s+/g, ' ');
                        const matchKey = Object.keys(checklist).find(k => 
                            k.replace(/[\\u200B]/g, '').trim().replace(/\\s+/g, ' ') === cellText && !usedKeys.has(k)
                        );
                        if (matchKey) {
                            usedKeys.add(matchKey);
                            let val = checklist[matchKey];
                            
                            // If item was NC or X but got levantado, mark as OK in Excel
                            if ((val === 'NC' || val === 'X') && checkIsLevantado(matchKey)) {
                                val = 'OK';
                            }
                            
                            // Write X to the appropriate column (K=OK/C, L=NC/X, M=N/A)
                            if (val === 'OK' || val === 'C') worksheet.getCell(rowNum, 11).value = 'x';
                            if (val === 'NC' || val === 'X') worksheet.getCell(rowNum, 12).value = 'x';
                            if (val === 'N/A') worksheet.getCell(rowNum, 13).value = 'x';
                        }
                    }
                });
            });

            `
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Successfully replaced checkmarks block');
