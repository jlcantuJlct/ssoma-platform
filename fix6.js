const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">')) {
        lines.splice(i, 1);
        // Find the matching </div> for this grid
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('</Card>')) {
                // The closing div is probably a few lines after </Card>
                for (let k = j; k < j + 10; k++) {
                    if (lines[k].trim() === '</div>') {
                        lines.splice(k, 1);
                        break;
                    }
                }
                break;
            }
        }
        break;
    }
}
fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
console.log('Removed grid wrapper from form');
