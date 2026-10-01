const fs = require('fs');

let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Fix observation box start
c = c.replace(
    /else if \(isBotiquin\) \{ obsCellStart = "A35"; obsCellEnd = "M42"; \}/,
    `else if (isBotiquin) { obsCellStart = "A36"; obsCellEnd = "M42"; }`
);

// Fix photo insertion row
c = c.replace(
    /else if \(isBotiquin\) currentImgRow = 44;/,
    `else if (isBotiquin) currentImgRow = 50;`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log("Fixed observation bounds and photo insertion row for Botiquines");
