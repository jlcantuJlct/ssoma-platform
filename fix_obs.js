const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /else if \(isCampamento\) \{\s*obsCellStart = "A57";\s*obsCellEnd = "M61";\s*\}/m,
    `else if (isCampamento) {
                obsCellStart = "A57";
                obsCellEnd = "M61";
            } else if (isInstalacionesElectricas) {
                obsCellStart = "A47";
                obsCellEnd = "M52";
            }`
);

c = c.replace(
    /if \(isCampamento\) \{\s*for\(let r=57; r<=61; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \}\s*\}/m,
    `if (isCampamento) {
                    for(let r=57; r<=61; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }
                } else if (isInstalacionesElectricas) {
                    for(let r=47; r<=52; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }
                }`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed obsCellStart for Instalaciones Electricas');
