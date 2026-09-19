const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// For inspector in Campamento:
// `} else if (normText.includes('inspector') || (normText.includes('nombre') && normText.includes('apellido'))) {`
const fixInspector = `} else if (normText === 'inspector' || normText === 'inspector:' || normText === 'nombre y apellido' || normText === 'nombre y apellido:') {`;
code = code.replace(/\} else if \(normText\.includes\('inspector'\) \|\| \(normText\.includes\('nombre'\) && normText\.includes\('apellido'\)\)\) \{/g, fixInspector);

// For inspector in Talleres:
// `else if (text.includes('inspector') || text.includes('nombre y apellido')) {`
code = code.replace(/else if \(text\.includes\('inspector'\) \|\| text\.includes\('nombre y apellido'\)\) \{/g, `else if (text === 'inspector' || text === 'inspector:' || text === 'nombre y apellido' || text === 'nombre y apellido:') {`);


fs.writeFileSync(path, code);
console.log("Fixed greedy inspector extraction!");
