
const fs = require('fs');

const draftsTxt = fs.readFileSync('./debug-program.json', 'utf16le').replace(/^\uFEFF/, '');
const drafts = JSON.parse(draftsTxt);

const usedUrls = new Set();
drafts.forEach(d => {
    if (d.doc_type !== 'PAD_SAN_CLEMENTE_INTERNAL.docx') {
        const fields = d.fields || {};
        for (const k in fields) {
            if (typeof fields[k] === 'string' && fields[k].startsWith('http')) {
                usedUrls.add(fields[k]);
            }
        }
    }
});

const blobs = require('./blobs_backup.json');
blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

const fields = {};
for (const b of blobs) {
    if (b.pathname.startsWith('foto_') && !usedUrls.has(b.url)) {
        const match = b.pathname.match(/^(foto_\d+)/);
        if (match) {
            const key = match[1];
            if (!fields[key]) {
                fields[key] = b.url;
            }
        }
    }
}

console.log('San Clemente will have', Object.keys(fields).length, 'fotos.');
fs.writeFileSync('app/api/draft/restore_script_temp/recovered_fields.json', JSON.stringify(fields, null, 2));
console.log('Written to recovered_fields.json');
