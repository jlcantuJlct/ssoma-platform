const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /let imgLev = null;\s*if \(data\.evidenciaLevantamiento\) \{\s*imgLev = stripB64\(data\.evidenciaLevantamiento\);\s*\}/;
const replacement = `let imgLev = null;
                    if (data.evidenciaLevantamiento) {
                        if (data.evidenciaLevantamiento.startsWith('{')) {
                            try {
                                const map = JSON.parse(data.evidenciaLevantamiento);
                                const descLine = \`- Kit \${kit.codigo || 'S/N'} (\${kit.ubicacion || 'S/U'}):\\n\${kit.observaciones || ''}\`;
                                if (map[descLine]) {
                                    imgLev = stripB64(map[descLine]);
                                }
                            } catch(e) {}
                        } else {
                            imgLev = stripB64(data.evidenciaLevantamiento);
                        }
                    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log("Patched export-excel Kit photos");
