const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /require\('fs'\)\.writeFileSync\('drive_error_status\.log', driveRes\.statusText\);\s*\}\s*\}/m;
c = c.replace(regex, `require('fs').writeFileSync('drive_error_status.log', driveRes.statusText);\n        }`);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed extra brace');
