const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

const target = `                closedAt: row.closed_at || null,`;
const rep = `                closedAt: row.closed_at || null,
                fotosDefectos: row.fotos_defectos_json ? JSON.parse(row.fotos_defectos_json) : {},`;

c = c.replace(target, rep);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Added fotosDefectos to GET response');
