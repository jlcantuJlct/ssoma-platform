const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(
    /const sectionsToRender = generalSections;/,
    `const generalNonFugas = generalSections.filter(s => s.type !== 'fugas');
    const fugas = generalSections.filter(s => s.type === 'fugas');
    const sectionsToRender = [...generalNonFugas, ...(specificSections[meta.tipoEquipo] || []), ...fugas];`
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed sectionsToRender');
