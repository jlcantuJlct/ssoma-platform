const fs = require('fs');

// 1. Fix Levantamiento Page
let lev = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');
if (!lev.includes('laboratorio')) {
    lev = lev.replace(
        /data\.finding\.moduleName\.toLowerCase\(\)\.includes\('comedor'\)\)\) \{/g,
        `data.finding.moduleName.toLowerCase().includes('comedor') || data.finding.moduleName.toLowerCase().includes('laboratorio'))) {`
    );
    fs.writeFileSync('app/levantamiento/[token]/page.tsx', lev);
    console.log("Patched levantamiento page.");
}

// 2. Fix Export Excel X marks
let route = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
let changes = 0;

route = route.replace(/worksheet\.getCell\("C10"\)\.value = "x";/g, () => {
    changes++;
    return 'worksheet.getCell("A10").value = "x";';
});
route = route.replace(/worksheet\.getCell\("C11"\)\.value = "x";/g, () => {
    changes++;
    return 'worksheet.getCell("A11").value = "x";';
});

fs.writeFileSync('app/api/export-excel/route.ts', route);
console.log(`Patched export-excel. Fixed ${changes} marks.`);
