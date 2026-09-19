const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

const formStart = 2031; // <div className="grid grid-cols-1 xl:grid-cols-5 gap-6"> (wait, actually I'll just remove the grid wrap)
const formEnd = 2284; // </div> for grid

let block = lines.splice(formStart, formEnd - formStart + 1);

// Let's remove xl:col-span-1 from the Card and make it max-w-5xl w-full
for (let i = 0; i < block.length; i++) {
    if (block[i].includes('xl:col-span-1')) {
        block[i] = block[i].replace('xl:col-span-1', 'max-w-5xl w-full mx-auto');
    }
}

// Find where to insert it in viewMode === 'menu'
let insertIdx = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* Panel Superior de Filtros */}')) {
        insertIdx = i; // wait, the container might be before this
        break;
    }
}

// Let's see if there's a wrapper for the filters
if (insertIdx !== -1) {
    // wait, I want it INSIDE the <div className="max-w-5xl w-full space-y-6"> or just before it?
    // Let's find the space-y-6 div
    while (!lines[insertIdx].includes('space-y-6')) {
        insertIdx--;
    }
    // Insert inside the space-y-6 div
    lines.splice(insertIdx + 1, 0, ...block);
    fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
    console.log('Moved form to menu');
}
