const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function build() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Botiquines.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    let sections = [];
    let currentSection = { title: 'Inspección de Botiquines', items: [] };
    
    for(let r=14; r<=33; r++) {
        const valB = ws.getCell(`B${r}`).value;
        if(valB && typeof valB === 'string') {
            const cleanText = valB.trim().replace(/\s+/g, ' ');
            if(cleanText !== 'Inspección de Botiquines') {
                currentSection.items.push(`'${cleanText.replace(/'/g, "\\'")}'`);
            }
        }
    }
    sections.push(currentSection);
    
    let sectionsStr = 'const sectionsToRender = [\n';
    sections.forEach(sec => {
        sectionsStr += `    {\n        title: '${sec.title}',\n        items: [\n            ${sec.items.join(',\n            ')}\n        ]\n    },\n`;
    });
    sectionsStr += '];';
    
    let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');
    c = c.replace(/CocinaComedorCustomForm/g, 'BotiquinesCustomForm');
    c = c.replace(/INSPECCIÓN DE COCINA Y COMEDOR/g, 'INSPECCIÓN DE BOTIQUÍN');
    c = c.replace(/isCocinaComedorMatrix/g, 'isBotiquinesMatrix');
    c = c.replace(/Cocina y Comedor/g, 'Botiquín');
    c = c.replace(/F-SIG-074/g, 'F-SIG-030');
    
    // Add 'hora' field
    c = c.replace(
        /const \[meta, setMeta\] = useState<any>\(\{/g,
        "const [meta, setMeta] = useState<any>({"
    );
    // Well, CocinaComedorCustomForm doesn't have Hora. I'll just use the standard fields.
    
    c = c.replace(/const sectionsToRender = \[\s*[\s\S]*?\s*\];/m, sectionsStr);
    
    fs.writeFileSync('components/inspections/BotiquinesCustomForm.tsx', c);
    console.log("Created BotiquinesCustomForm.tsx");
}
build().catch(console.error);
