const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(
    "const handleCheck = (item: string, value: string) => {\n        setChecklist(prev => ({ ...prev, [item]: value }));\n    };",
    "const handleCheck = (item: string, value: string) => {\n" +
"        setChecklist(prev => ({ ...prev, [item]: value }));\n" +
"        \n" +
"        setObservaciones(prev => {\n" +
"            let next = prev;\n" +
"            const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n" +
"            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(.*?\\\\)\\\\n?', 'g');\n" +
"            next = next.replace(regex, '');\n" +
"            \n" +
"            if (['R', 'M', 'F', 'RESUM', 'FUGA'].includes(value)) {\n" +
"                const prefix = '- ' + item + ' (' + value + ')';\n" +
"                next = next ? next.trim() + '\\n' + prefix : prefix;\n" +
"            }\n" +
"            return next.trim();\n" +
"        });\n" +
"    };"
);

const yellowBoxRegex = /\{badItems\.length > 0 && \([\s\S]*?<\/div>\s*\)\}/;
c = c.replace(yellowBoxRegex, '');

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed handleCheck and removed yellow box');
