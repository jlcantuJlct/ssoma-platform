const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
    if (lines[i].includes(')}')) {
        if (lines[i+1] && lines[i+1].includes('{/* HISTORIAL Y TABLA')) {
            lines.splice(i, 1);
            break;
        }
        if (lines[i+2] && lines[i+2].includes('{/* HISTORIAL Y TABLA')) {
            lines.splice(i, 1);
            break;
        }
    }
}

// And check where the digital modal is closing wrongly. Let's look at 2068
// In full_rewrite2.js I appended `</div></div></main>)}` to digitalStr.
// But the original file probably had something else.

fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
