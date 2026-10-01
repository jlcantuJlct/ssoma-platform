const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /const occurrenceTracker = \{\};\s*\/\/ Checkmarks\s*worksheet\.eachRow\(\(row, rowNum\) => \{\s*row\.eachCell\(\(cell, colNum\) => \{/m;

const replacement = `const occurrenceTracker = {};

              // Checkmarks
              worksheet.eachRow((row, rowNum) => {
                  const seenInRow = new Set();
                  row.eachCell((cell, colNum) => {`;
                  
c = c.replace(regex, replacement);

const regex2 = /\/\/ Count how many times we've seen this exact text in the Excel file\s*occurrenceTracker\[cellText\] = \(occurrenceTracker\[cellText\] \|\| 0\) \+ 1;/;

const replacement2 = `// Count how many times we've seen this exact text in the Excel file (once per row to avoid merged cells duplication)
                          if (!seenInRow.has(cellText)) {
                              seenInRow.add(cellText);
                              occurrenceTracker[cellText] = (occurrenceTracker[cellText] || 0) + 1;
                          }`;

c = c.replace(regex2, replacement2);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed merged cells duplication for occurrenceTracker');
