const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const relsXml = fs.readFileSync('temp_unzip/word/_rels/document.xml.rels', 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const parsed = parser.parse(relsXml);

const rels = parsed.Relationships.Relationship;
const ids = new Set();
let duplicates = 0;

if (Array.isArray(rels)) {
    for (const rel of rels) {
        const id = rel['@_Id'];
        if (ids.has(id)) {
            console.log("DUPLICATE ID:", id);
            duplicates++;
        }
        ids.add(id);
    }
}
if (duplicates === 0) console.log("✅ No duplicate relationships found.");
else console.log(`❌ Found ${duplicates} duplicates!`);
