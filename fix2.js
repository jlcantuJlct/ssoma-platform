const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

const histStart = 2063;
const histEnd = 2283; // exclusive

const block = lines.splice(histStart, histEnd - histStart);

let insertIdx = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("viewMode === 'menu'")) {
        for(let j=i; j<i+50; j++) {
            if (lines[j] && lines[j].includes('</main>')) {
                insertIdx = j;
                break;
            }
        }
        break;
    }
}

if (insertIdx !== -1) {
    // Insert right before </main>
    lines.splice(insertIdx, 0, ...block);
    fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
    console.log('Moved history block to', insertIdx);
} else {
    console.log('Failed to find menu block');
}
