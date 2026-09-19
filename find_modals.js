const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');
const lines = code.split('\n');

// Find showCreateModuleModal
let mod1Start = -1, mod1End = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{showCreateModuleModal && (')) {
        mod1Start = i - 1; // get the { /* Modal ... */ } comment if any, let's just use i
        // Find closing div
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes(')}')) {
                // Check if it closes the modal. The modal ends with </div></div>)}
                if (lines[j-1].includes('</div>') && lines[j-2].includes('</div>')) {
                    mod1End = j;
                    break;
                }
            }
        }
        break;
    }
}

// Find showFormatOptionsModal
let mod2Start = -1, mod2End = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{showFormatOptionsModal && (')) {
        mod2Start = i;
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes(')}')) {
                if (lines[j-1].includes('</div>') && lines[j-2].includes('</div>')) {
                    mod2End = j;
                    break;
                }
            }
        }
        break;
    }
}

// Find showParserModal
let mod3Start = -1, mod3End = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{showParserModal && (')) {
        mod3Start = i;
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes(')}')) {
                if (lines[j-1].includes('</div>') && lines[j-2].includes('</div>')) {
                    mod3End = j;
                    break;
                }
            }
        }
        break;
    }
}

console.log("mod1:", mod1Start, mod1End);
console.log("mod2:", mod2Start, mod2End);
console.log("mod3:", mod3Start, mod3End);

// Actually, they are likely contiguous from mod1Start to mod3End! Let's check!
// If they are contiguous, we can extract them in one block.
