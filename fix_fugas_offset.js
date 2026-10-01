const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /if \(fugaItems\.includes\(item\)\) \{\s*if \(val === 'N\/A'\) return 2;\s*if \(val === 'RESUM'\) return 3;\s*if \(val === 'FUGA'\) return 4;\s*\}/g,
    "if (fugaItems.includes(item)) {\n                    if (val === 'N/A') return 2;\n                    if (val === 'RESUM') return 4;\n                    if (val === 'FUGA') return 6;\n                }"
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed fugas offset');
