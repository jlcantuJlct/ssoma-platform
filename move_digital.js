const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

let start = -1, end = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("{viewMode === 'digital' && (")) start = i;
    if (start !== -1 && lines[i].includes('</div></div></main>)}')) { end = i; break; }
}

if (start === -1) {
    console.log("Could not find viewMode === 'digital'");
    process.exit(1);
}

let digitalBlock = lines.splice(start, end - start + 1);

let insertIdx = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("{viewMode === 'fisica' && (")) {
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes('</main>')) {
                if (lines[j+1].includes(')}')) {
                    insertIdx = j + 2;
                    break;
                }
            }
        }
        break;
    }
}

if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, ...digitalBlock);
    fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
    console.log('Moved digital block to root!');
} else {
    console.log('Could not find insert index!');
}
