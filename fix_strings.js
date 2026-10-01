const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function fix() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Inspeccion de cocina y comedor.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    let items = [];
    let currentCategory = "";
    
    for(let r=14; r<=52; r++) {
        const valA = ws.getCell(`A${r}`).value;
        let valB = ws.getCell(`B${r}`).value;
        if(typeof valB === 'string') valB = valB.trim().replace(/\s+/g, ' ');
        
        if (valA && typeof valA === 'string' && !parseInt(valA)) {
            // It's a category
            currentCategory = valA.trim().replace(/\s+/g, ' ');
            items.push(`  { text: "${currentCategory.replace(/"/g, '\\"')}", type: "title", isTitle: true, category: "${currentCategory.replace(/"/g, '\\"')}" }`);
        } else if (valB && typeof valB === 'string') {
            items.push(`  { text: "${valB.replace(/"/g, '\\"')}", type: "radio", category: "${currentCategory.replace(/"/g, '\\"')}" }`);
        }
    }
    
    const itemsStr = items.join(',\n');
    
    let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');
    c = c.replace(/const template = \[\s*[\s\S]*?\s*\];/m, `const template = [\n${itemsStr}\n];`);
    fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
    console.log("Fixed template strings in React component!");
}
fix().catch(console.error);
