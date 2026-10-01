const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(
    /if \(row\.inspection_record_id\) \{/g,
    'if (row.inspection_record_id && driveUrl) {'
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed empty drive_url override');
