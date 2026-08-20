const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

const regex = /const res = await fetch\(`\/api\/references\?docType=\$\{docType\}`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);\s*setReferenceMap\(data\.references \|\| \{\}\);/s;

const replacement = `const res = await fetch('/references_map.json');
            if (res.ok) {
                const data = await res.json();
                setReferenceMap(data[docType] || {});`;

content = content.replace(regex, replacement);
fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Replaced correctly');
