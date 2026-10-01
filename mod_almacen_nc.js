const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

c = c.replace(/<span className="font-black bg-red-500 text-white px-1 rounded">X<\/span> No Cumple \(NC\)/g, '<span className="font-black bg-red-500 text-white px-1 rounded">NC</span> No Conforme');

c = c.replace(/\['OK', 'X', 'N\/A'\]\.map/g, "['OK', 'NC', 'N/A'].map");

c = c.replace(/if \(opt === 'X'\) bg = "bg-red-500 text-white border-red-600 shadow-inner";/g, 'if (opt === \'NC\') bg = "bg-red-500 text-white border-red-600 shadow-inner";');

c = c.replace(/checklist\[item\] === 'X'/g, "checklist[item] === 'NC'");

c = c.replace(/if \(\['X'\]\.includes\(value\)\) \{/g, "if (['NC'].includes(value)) {");

c = c.replace(/const badItemsList = Object\.entries\(checklist\)\.filter\(\(\[_, val\]\) => \['X'\]\.includes\(val\)\);/g, "const badItemsList = Object.entries(checklist).filter(([_, val]) => ['NC'].includes(val));");

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Replaced X with NC in UI');
