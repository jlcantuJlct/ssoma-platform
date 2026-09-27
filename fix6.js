const fs = require('fs');
let content = fs.readFileSync('components/inspections/ExtinguisherCustomForm.tsx', 'utf-8');
content = content.replace("obs.replace(/\\]\\\\s+\\[/g, ']\\n[');", "obs.replace(/\\]\\s+\\[/g, ']\\n[');");
fs.writeFileSync('components/inspections/ExtinguisherCustomForm.tsx', content);
