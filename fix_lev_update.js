const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(
    /'UPDATE inspection_records SET evidence_pdf = \?, status = \? WHERE id = \?'/g,
    `'UPDATE inspection_records SET evidence_pdf = ?, status = ?, updated_at = ? WHERE id = ?'`
);

c = c.replace(
    /\[driveUrl, finalStatus, row\.inspection_record_id\]/g,
    `[driveUrl, finalStatus, Date.now(), row.inspection_record_id]`
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed updated_at in levantamiento');
