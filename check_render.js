const fs = require('fs');
const content = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');
if (content.includes('getSpecificSections(meta.tipoEquipo as any).map')) {
    console.log('Specific sections are rendered');
} else {
    console.log('Specific sections are NOT rendered!!!');
}
