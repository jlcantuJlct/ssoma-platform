const fs = require('fs');
let c = fs.readFileSync('app/actions.ts', 'utf8');

c = c.replace(
    /fs\.writeFileSync\('C:\/Users\/jlcan\/Desktop\/error\.txt', "GETINSPECTIONS ERR: " \+ String\(e\) \+ " \\n" \+ \(e\.stack\|\|""\)\);\n        /g,
    ''
);

fs.writeFileSync('app/actions.ts', c);
console.log('Removed logger');
