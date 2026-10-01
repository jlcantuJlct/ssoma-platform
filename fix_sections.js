const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function fix() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Inspeccion de cocina y comedor.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    let sections = [];
    let currentSection = null;
    
    for(let r=14; r<=52; r++) {
        const valA = ws.getCell(`A${r}`).value;
        let valB = ws.getCell(`B${r}`).value;
        if(typeof valB === 'string') valB = valB.trim().replace(/\s+/g, ' ');
        
        if (valA && typeof valA === 'string' && !parseInt(valA)) {
            // It's a category
            if (currentSection) sections.push(currentSection);
            currentSection = {
                title: valA.trim().replace(/\s+/g, ' '),
                items: []
            };
        } else if (valB && typeof valB === 'string' && currentSection) {
            currentSection.items.push(`'${valB.replace(/'/g, "\\'")}'`);
        }
    }
    if (currentSection) sections.push(currentSection);
    
    let sectionsStr = 'const sectionsToRender = [\n';
    sections.forEach(sec => {
        sectionsStr += `    {\n        title: '${sec.title}',\n        items: [\n            ${sec.items.join(',\n            ')}\n        ]\n    },\n`;
    });
    sectionsStr += '];';
    
    let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');
    c = c.replace(/const sectionsToRender = \[\s*[\s\S]*?\s*\];/m, sectionsStr);
    fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
    console.log("Fixed sectionsToRender in React component!");
}
fix().catch(console.error);
