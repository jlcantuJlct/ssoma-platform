const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

const regex = /UPDATE inspection_records SET drive_url = \? WHERE id = \?`;\s*const params = \[driveUrl, row\.inspection_record_id\];/m;
// Wait, my previous query was:
// \`UPDATE inspection_records SET drive_url = ? WHERE id = ?\`, [driveUrl, row.inspection_record_id]

const regexUpdate = /UPDATE inspection_records SET drive_url = \? WHERE id = \?/g;

c = c.replace(regexUpdate, "UPDATE inspection_records SET drive_url = ?, status = CASE WHEN ? = 'Cerrado' THEN 'Cerrado' ELSE status END WHERE id = ?");

const regexParams = /\[driveUrl, row\.inspection_record_id\]/g;
c = c.replace(regexParams, "[driveUrl, finalStatus, row.inspection_record_id]");

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed inspection_records status update');
