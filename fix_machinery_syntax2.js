const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

const target = "const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(.*?\\\\)\\\\n?', 'g');\n            next = next.replace(regex, '');\n            \n            if (['R', 'M', 'F', 'RESUM', 'FUGA'].includes(value)) {\n                const prefix = '- ' + item + ' (' + value + ')';\n                next = next ? next.trim() + '\\n' + prefix : prefix;\n            }\n            return next.trim();\n        });\n    };";

const startIdx = c.indexOf("const escapeRegex");
if (startIdx !== -1) {
    const endIdx = c.indexOf("};", startIdx) + 2;
    // Actually there is another function inside, wait let me just replace the corrupted string literally.
}

c = c.replace(/const escapeRegex = \(s\) => s\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g, '[\\s\\S]*?\}\;\);/, 
    "const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$$&');\n" +
    "            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(.*?\\\\)\\\\n?', 'g');\n" +
    "            next = next.replace(regex, '');\n" +
    "            \n" +
    "            if (['R', 'M', 'F', 'RESUM', 'FUGA'].includes(value)) {\n" +
    "                const prefix = '- ' + item + ' (' + value + ')';\n" +
    "                next = next ? next.trim() + '\\n' + prefix : prefix;\n" +
    "            }\n" +
    "            return next.trim();\n" +
    "        });"
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed handleCheck syntax error');
