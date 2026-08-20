
const fs = require('fs');
const blobs = require('./blobs_backup.json');

// Sort by date descending
blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

const fields = {};
for (const b of blobs) {
    if (b.pathname.startsWith('foto_')) {
        // Extract foto_XXX
        const match = b.pathname.match(/^(foto_\d+)/);
        if (match) {
            const key = match[1];
            // Only keep the newest one for each key
            if (!fields[key]) {
                fields[key] = b.url;
            }
        }
    }
}

console.log('Recovered', Object.keys(fields).length, 'fotos.');
fs.writeFileSync('recovered_fields.json', JSON.stringify(fields, null, 2));
