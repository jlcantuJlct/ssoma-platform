const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = "try { worksheet.mergeCells(`${obsCellStart}:${obsCellEnd}`); } catch(e) {}";
const rep = `try { 
                if (isCampamento) {
                    for(let r=57; r<=61; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }
                }
                worksheet.mergeCells(\`\${obsCellStart}:\${obsCellEnd}\`); 
            } catch(e) {}`;
c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed Campamento merge cells for observaciones');
