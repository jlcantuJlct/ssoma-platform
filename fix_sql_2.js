const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(
    /'UPDATE hallazgo_levantamientos SET status = \?, evidence = \?, comentario = \?, closed_at = \$\{isParcial \? 'NULL' : 'CURRENT_TIMESTAMP'\} WHERE token = \?'/g,
    '`UPDATE hallazgo_levantamientos SET status = ?, evidence = ?, comentario = ?, closed_at = ${isParcial ? \'NULL\' : \'CURRENT_TIMESTAMP\'} WHERE token = ?`'
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed backticks');
