const fs = require('fs');

let c = fs.readFileSync('components/inspections/BotiquinCustomForm.tsx', 'utf8');

c = c.replace(
    /const \[meta, setMeta\] = useState<any>\(\{/,
    `const [meta, setMeta] = useState<any>({\n        hora: (() => { const now = new Date(); return \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`; })(),`
);

fs.writeFileSync('components/inspections/BotiquinCustomForm.tsx', c);
console.log("Initialized hora");
