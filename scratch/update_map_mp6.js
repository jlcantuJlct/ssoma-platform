const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', 'public', 'references_map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const mp6Dir = path.join(__dirname, '..', 'public', 'referencias_mp6');
const mp6Files = fs.readdirSync(mp6Dir);

const newMp6Map = {};
for (const file of mp6Files) {
    if (file.startsWith('foto_')) {
        const tag = file.split('.')[0];
        newMp6Map[tag] = `/referencias_mp6/${file}?v=${Date.now()}`;
    }
}

map['MP6_INTERNAL.docx'] = newMp6Map;

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log("references_map.json updated with MP6!");
