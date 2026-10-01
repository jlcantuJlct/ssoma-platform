const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(/isMachineryMatrix: levantamiento\.module_name\.includes\('Maquinaria'\)/, `isMachineryMatrix: levantamiento.module_name.includes('Maquinaria'),\n                    isAlmacenMatrix: levantamiento.module_name.includes('Almac')`);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Added isAlmacenMatrix to levantamiento route');
