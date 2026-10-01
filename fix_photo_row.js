const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /} else if \(isCampamento\) {\n                  obsCellStart = "A57";\n                  obsCellEnd = "M61";\n              }/m,
    `} else if (isCampamento) {\n                  obsCellStart = "A57";\n                  obsCellEnd = "M61";\n              } else if (isInstalacionesElectricas) {\n                  obsCellStart = "A47";\n                  obsCellEnd = "M51";\n              }`
);

c = c.replace(
    /if \(isCampamento\) {\n                      for\(let r=57; r<=61; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \}\n                  }/m,
    `if (isCampamento) {\n                      for(let r=57; r<=61; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                  } else if (isInstalacionesElectricas) {\n                      for(let r=47; r<=51; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} }\n                  }`
);

c = c.replace(
    /else if \(isCampamento\) currentImgRow = 65;/m,
    `else if (isCampamento) currentImgRow = 65;\n              else if (isInstalacionesElectricas) currentImgRow = 53;`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed observation and photo row injection for Instalaciones Electricas');
