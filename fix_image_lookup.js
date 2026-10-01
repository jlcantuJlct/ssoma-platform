const fs = require('fs');
let route = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Replace strict lookup with startsWith lookup for images
route = route.replace(
    /if \(evidenciasMapLocal\[item\] && typeof evidenciasMapLocal\[item\] === 'string' && evidenciasMapLocal\[item\]\.length > 50\) imgLev = stripB64\(evidenciasMapLocal\[item\]\);/g,
    `let matchImgLev = Object.entries(evidenciasMapLocal).find(([k,v]) => k.startsWith(item) && v && v.length > 50);\n                          if (matchImgLev) imgLev = stripB64(matchImgLev[1]);`
);

fs.writeFileSync('app/api/export-excel/route.ts', route);
console.log("Fixed levantamiento image lookup!");
