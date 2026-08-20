
const fs = require('fs');
const blobs = require('./blobs_backup.json');

// Sort by date descending
blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

const fields = {};
for (const b of blobs) {
    if (b.pathname.startsWith('foto_')) {
        const match = b.pathname.match(/^(foto_\d+)/);
        if (match) {
            const key = match[1];
            const date = new Date(b.uploadedAt);
            const dStr = date.toISOString().split('T')[0];
            
            // We want to skip Barandas which was likely July 1-2.
            // Let's check if we already found a good one
            if (!fields[key]) {
                fields[key] = { url: b.url, date: dStr };
            } else {
                // If the one we found is from July 1-2, and this one is from June 30 or before,
                // maybe we prefer the older one?
                const currentDStr = fields[key].date;
                if ((currentDStr === '2026-07-01' || currentDStr === '2026-07-02') && 
                    (dStr === '2026-06-30' || dStr === '2026-06-25')) {
                    fields[key] = { url: b.url, date: dStr };
                }
            }
        }
    }
}

const finalFields = {};
let replaced = 0;
for (const k in fields) {
    finalFields[k] = fields[k].url;
    if (fields[k].date === '2026-06-30' || fields[k].date === '2026-06-25') replaced++;
}
console.log('Recovered', Object.keys(finalFields).length, 'fotos.');
console.log('Replaced', replaced, 'from Barandas dates to San Clemente dates.');
fs.writeFileSync('recovered_fields_smart.json', JSON.stringify(finalFields, null, 2));
