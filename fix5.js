const fs = require('fs');
let content = fs.readFileSync('components/inspections/ExtinguisherCustomForm.tsx', 'utf-8');
content = content.replace("obs = `${prefix}\\n${obs}`.trim();\r\n        copy[idx].observaciones = obs;", "obs = `${prefix}\\n${obs}`.trim();\n        obs = obs.replace(/\\]\\\\s+\\[/g, ']\\n[');\n        copy[idx].observaciones = obs;");
content = content.replace("obs = `${prefix}\\n${obs}`.trim();\n        copy[idx].observaciones = obs;", "obs = `${prefix}\\n${obs}`.trim();\n        obs = obs.replace(/\\]\\\\s+\\[/g, ']\\n[');\n        copy[idx].observaciones = obs;");
fs.writeFileSync('components/inspections/ExtinguisherCustomForm.tsx', content);
