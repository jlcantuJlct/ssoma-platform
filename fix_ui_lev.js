const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(
    /<p className="text-slate-800 font-semibold mb-2">\{finding\.description\}<\/p>/,
    '<p className="text-slate-800 font-semibold mb-2 whitespace-pre-wrap">{finding.description}</p>'
);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed UI whitespace');
