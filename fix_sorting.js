const fs = require('fs');
let c = fs.readFileSync('app/actions.ts', 'utf8');

const tableCreation = `CREATE TABLE IF NOT EXISTS inspection_records (
            id INT PRIMARY KEY,
            date VARCHAR(50),
            responsible VARCHAR(100),
            inspection_type VARCHAR(200),
            area VARCHAR(50),
            zone VARCHAR(100),
            status VARCHAR(50),
            observations TEXT,
            evidence_pdf TEXT,
            evidence_imgs TEXT
        )
    \`);`;

const tableAlteration = `
    try {
        await db.execute(\`ALTER TABLE inspection_records ADD COLUMN updated_at BIGINT\`);
        await db.execute(\`UPDATE inspection_records SET updated_at = id WHERE updated_at IS NULL\`);
    } catch(e) {}
`;
c = c.replace(tableCreation, tableCreation + tableAlteration);

c = c.replace(
    /evidence_imgs = \?\n\s*WHERE id = \?/g,
    'evidence_imgs = ?, updated_at = ?\n            WHERE id = ?'
);

c = c.replace(
    /JSON\.stringify\(record\.evidenceImgs \|\| \[\]\),\n\s*record\.id/g,
    'JSON.stringify(record.evidenceImgs || []),\n            Date.now(),\n            record.id'
);

c = c.replace(
    /SELECT \* FROM inspection_records ORDER BY id DESC/g,
    'SELECT * FROM inspection_records ORDER BY COALESCE(updated_at, id) DESC'
);

fs.writeFileSync('app/actions.ts', c);
console.log('Fixed ordering by updated_at');
