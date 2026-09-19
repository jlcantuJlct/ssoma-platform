const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// The line currently is:
// `} else if (normText.includes('especifica') || (normText.includes('area') && normText.includes('inspeccion')) || normText.includes('ubicacion')) {`
// Let's replace it with:
// `} else if (normText === 'ubicacion de campamento' || normText === 'ubicacion de campamento:' || normText === 'area especifica de la inspeccion' || normText === 'area especifica de la inspeccion:') {`

const oldAreaMatch = /\} else if \(normText\.includes\('especifica'\) \|\| \(normText\.includes\('area'\) && normText\.includes\('inspeccion'\)\) \|\| normText\.includes\('ubicacion'\)\) \{/g;
const newAreaMatch = `} else if (normText === 'ubicacion de campamento' || normText === 'ubicacion de campamento:' || normText === 'area especifica de la inspeccion' || normText === 'area especifica de la inspeccion:') {`;

code = code.replace(oldAreaMatch, newAreaMatch);

// What about Talleres?
// `else if (text.includes('área de inspección') || text.includes('area de inspeccion')) area = val;`
// This is already safe because 'área de inspección' doesn't easily collide, but let's make it strict just in case.
const oldTalleresArea = /else if \(text\.includes\('área de inspección'\) \|\| text\.includes\('area de inspeccion'\)\) area = val;/g;
const newTalleresArea = `else if (text === 'área de inspección' || text === 'area de inspeccion' || text === 'area de inspeccion:') area = val;`;
code = code.replace(oldTalleresArea, newTalleresArea);

fs.writeFileSync(path, code);
console.log("Fixed greedy area extraction!");
