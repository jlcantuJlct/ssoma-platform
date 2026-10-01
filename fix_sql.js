const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(
    /UPDATE hallazgo_levantamientos SET status = \?, evidence = \?, comentario = \?, closed_at = CURRENT_TIMESTAMP WHERE token = \?',\s*\['Cerrado',/g,
    'UPDATE hallazgo_levantamientos SET status = ?, evidence = ?, comentario = ?, closed_at = ${isParcial ? \'NULL\' : \'CURRENT_TIMESTAMP\'} WHERE token = ?\',\n            [finalStatus,'
);

c = c.replace(
    /UPDATE inspection_records SET evidence_pdf = \?, status = \? WHERE id = \?',\s*\[driveUrl, 'Cerrado', row\.inspection_record_id\]/g,
    'UPDATE inspection_records SET evidence_pdf = ?, status = ? WHERE id = ?\',\n                    [driveUrl, finalStatus, row.inspection_record_id]'
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed UPDATE statements');
