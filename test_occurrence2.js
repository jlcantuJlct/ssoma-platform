const ExcelJS = require('exceljs');

async function test() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const worksheet = workbook.worksheets[0];
    
    const checklist = {
        "Vias peatonales señalizadas": "C",
        "Vias peatonales señalizadas\u200B": "C"
    };
    
    const occurrenceTracker = {};
    worksheet.eachRow((row, rowNum) => {
        const seenInRow = new Set();
        row.eachCell((cell, colNum) => {
            if (typeof cell.value === 'string') {
                const cellText = cell.value.trim().replace(/\s+/g, ' ');
                if (cellText === "Vias peatonales señalizadas") {
                    if (!seenInRow.has(cellText)) {
                        seenInRow.add(cellText);
                        occurrenceTracker[cellText] = (occurrenceTracker[cellText] || 0) + 1;
                    }
                    const expectedKey = cellText + '\u200B'.repeat(occurrenceTracker[cellText] - 1);
                    console.log(`Row ${rowNum}, Col ${colNum}: cellText="${cellText}", count=${occurrenceTracker[cellText]}, expectedKey="${expectedKey.replace(/\u200B/g, '<ZWSP>')}", checklistHas=${!!checklist[expectedKey]}`);
                }
            }
        });
    });
}
test();
