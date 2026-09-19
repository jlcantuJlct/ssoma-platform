const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

const badItemsMatch = /const badItems = template[\s\S]*?NO CONFORME' \}\);/;
if (c.match(badItemsMatch)) {
    c = c.replace(badItemsMatch, `$&

    const badItemsText = badItems.length > 0 ? 'HALLAZGOS REGISTRADOS:\\n' + badItems.map(b => '- ' + b.text + ' (' + b.val + ')').join('\\n') : '';
    const obsIndex = template.findIndex(t => t.text.toLowerCase().includes('observacion') || t.text.toLowerCase().includes('comentario'));
    const userObs = obsIndex !== -1 && answers[obsIndex] ? answers[obsIndex].text || '' : '';
    const combinedObs = [badItemsText, userObs].filter(Boolean).join('\\n\\n');
`);
}

c = c.replace(/body: JSON\.stringify\(\{ moduleName: decodeURIComponent\(moduleName as string\), answers: lightAnswers, template, saveToDrive: true, fotosDefectos \}\)/g, 
    'body: JSON.stringify({ moduleName: decodeURIComponent(moduleName as string), answers: lightAnswers, template, saveToDrive: true, fotosDefectos, observaciones: combinedObs })');

c = c.replace(/initialObservations=\{typeof answers.*?\}\s*isOpen/g, 'initialObservations={combinedObs} \n                isOpen');

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Patched page.tsx!');
