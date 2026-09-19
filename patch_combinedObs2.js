const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

const hook = 'const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);';

const injection = hook + `
    const badItemsText = template
        .map((item, idx) => ({ text: item.text, ans: answers[idx] }))
        .filter(({ ans }) => ans?.text === 'NC' || ans?.isConforme === false)
        .map(({ text, ans }) => '- ' + text + ' (' + (ans?.text === 'NC' ? 'NC' : 'NO CONFORME') + ')')
        .join('\\n');
    const obsIndex = template.findIndex(t => t.text.toLowerCase().includes('observacion') || t.text.toLowerCase().includes('comentario'));
    const userObs = obsIndex !== -1 && answers[obsIndex] ? answers[obsIndex].text || '' : '';
    const combinedObs = [(badItemsText ? 'HALLAZGOS REGISTRADOS:\\n' + badItemsText : ''), userObs].filter(Boolean).join('\\n\\n');
`;

c = c.replace(hook, injection);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Fixed combinedObs properly this time!');
