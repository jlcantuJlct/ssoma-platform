const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

// The block to extract is from 1438 (showCreateModuleModal) to 1744 (end of showQuotaSettings)
// We'll find them programmatically to be safe against line shifts
let startIdx = -1, endIdx = -1;

for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{showCreateModuleModal && (')) {
        startIdx = i;
        break;
    }
}

for(let i=startIdx; i<lines.length; i++) {
    if (lines[i].includes('HISTORIAL Y TABLA')) {
        // go back to the previous blank lines
        for(let j=i-1; j>startIdx; j--) {
            if (lines[j].includes(')}')) {
                endIdx = j;
                break;
            }
        }
        break;
    }
}

console.log("Start:", startIdx, "End:", endIdx);

if (startIdx !== -1 && endIdx !== -1) {
    let modals = lines.splice(startIdx, endIdx - startIdx + 1);
    
    // Find final </div>
    let insertIdx = -1;
    for(let i=lines.length-1; i>=0; i--) {
        if (lines[i].includes('</div >') || lines[i].includes('</div>')) {
            if (lines[i+1] && lines[i+1].includes(');')) {
                insertIdx = i;
                break;
            }
        }
    }
    console.log("Insert at:", insertIdx);
    
    if (insertIdx !== -1) {
        lines.splice(insertIdx, 0, ...modals);
        fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
        console.log("Moved modals successfully.");
    }
}
