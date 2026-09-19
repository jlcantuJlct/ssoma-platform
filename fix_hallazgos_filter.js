const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace the greedy filter inside hallazgosNC loops
const badFilter = /if \(\['proyecto', 'fecha', 'inspector', 'cargo', 'responsable', 'planificada', 'observacion', 'comentario', 'area', 'especifica'\]\.some\(k => normText\.includes\(k\)\)\) return;/g;
const newFilter = `// removed greedy filter for hallazgos`;
code = code.replace(badFilter, newFilter);

fs.writeFileSync(path, code);
console.log("Fixed hallazgosNC filter!");
