const ExcelJS = require('exceljs');

async function extractQuestions() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    let categories = [];
    let currentCategory = null;
    
    for (let i = 1; i <= 60; i++) {
        const row = sheet.getRow(i);
        const cellB = row.getCell(2).value;
        const cellA = row.getCell(1).value;
        
        if (typeof cellB === 'string') {
            const text = cellB.trim();
            // If it spans many columns and has no 'C', 'NC', 'N/A' on the same line except headers
            if (row.getCell(11).value === 'C' && row.getCell(12).value === 'NC') {
                if (currentCategory) categories.push(currentCategory);
                currentCategory = { category: text, items: [] };
            } else if (currentCategory && text && text.length > 3) {
                // Ignore "Comentarios u Observaciones"
                if (text.toLowerCase().includes("comentarios") || text.toLowerCase().includes("observaciones")) {
                    if (currentCategory.items.length > 0) categories.push(currentCategory);
                    currentCategory = null;
                    continue;
                }
                currentCategory.items.push(text.replace(/\r?\n|\r/g, ' '));
            }
        }
    }
    if (currentCategory && currentCategory.items.length > 0) categories.push(currentCategory);
    
    console.log(JSON.stringify(categories, null, 2));
}
extractQuestions();
