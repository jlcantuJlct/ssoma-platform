const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', 'public', 'references_map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const padDir = path.join(__dirname, '..', 'public', 'referencias_pad');
const padFiles = fs.readdirSync(padDir);

const newPadMap = {};
for (const file of padFiles) {
    if (file.startsWith('foto_')) {
        const tag = file.split('.')[0];
        newPadMap[tag] = `/referencias_pad/${file}`;
    }
}

map['PAD_SAN_CLEMENTE_INTERNAL.docx'] = newPadMap;

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log("references_map.json updated!");
