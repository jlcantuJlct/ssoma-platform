const fs = require('fs');
let lev = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

if (!lev.includes('botiquin')) {
    lev = lev.replace(
        /data\.finding\.moduleName\.toLowerCase\(\)\.includes\('laboratorio'\)\)\) \{/g,
        `data.finding.moduleName.toLowerCase().includes('laboratorio') || data.finding.moduleName.toLowerCase().includes('botiquin'))) {`
    );
    fs.writeFileSync('app/levantamiento/[token]/page.tsx', lev);
    console.log("Patched levantamiento page for botiquin.");
}
