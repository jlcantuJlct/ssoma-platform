const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(/const escapeRegex = \(s\) => s\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g, \'\\\\const handleCheck = \(item: string, value: string\) => \{\s*setChecklist\(prev => \(\{ \.\.\.prev, \[item\]: value \}\)\);\s*\}\;\'\);/g, "const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');");

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log("Fixed syntax");
