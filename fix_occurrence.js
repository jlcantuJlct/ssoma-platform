const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /const usedKeys = new Set\(\);[\s\S]*?if \(matchKey\) \{[\s\S]*?usedKeys\.add\(matchKey\);/m;

const replacement = `const occurrenceTracker = {};

            // Checkmarks
            worksheet.eachRow((row, rowNum) => {
                row.eachCell((cell, colNum) => {
                    if (typeof cell.value === 'string') {
                        const cellText = cell.value.trim().replace(/\\s+/g, ' ');
                        
                        // Count how many times we've seen this exact text in the Excel file
                        occurrenceTracker[cellText] = (occurrenceTracker[cellText] || 0) + 1;
                        
                        // Reconstruct the exact key used in the UI (appends \\u200B for duplicates)
                        const expectedKey = cellText + '\\u200B'.repeat(occurrenceTracker[cellText] - 1);
                        
                        if (checklist[expectedKey]) {
                            const matchKey = expectedKey;`;

c = c.replace(regex, replacement);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed occurrenceTracker logic using better regex');
