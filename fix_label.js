const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(/<\/label><\/label>/g, '</label>');

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed extra label tag');
