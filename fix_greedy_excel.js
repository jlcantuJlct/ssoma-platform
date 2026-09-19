const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to fix `if (normText.includes('proyecto'))` inside BOTH isTalleres and isCampamento.
// It should be `if (normText === 'proyecto' || normText === 'proyecto:' || normText === 'nombre del proyecto')`

// Actually, in `isCampamento`:
// `if (normText.includes('proyecto')) {`
// Let's replace it with:
// `if (normText === 'proyecto' || normText === 'proyecto:') {`

code = code.replace(/if \(normText\.includes\('proyecto'\)\) \{/g, "if (normText === 'proyecto' || normText === 'proyecto:') {");

// And for Talleres:
// `if (text.includes('proyecto')) proyecto = val || proyecto;`
code = code.replace(/if \(text\.includes\('proyecto'\)\) proyecto = val \|\| proyecto;/g, "if (text === 'proyecto' || text === 'proyecto:') proyecto = val || proyecto;");

// Wait, are there other greedy matches?
// `else if (normText.includes('inspector') || ...)`
// Let's replace them carefully!

fs.writeFileSync(path, code);
console.log("Fixed greedy proyecto extraction in Excel export!");
