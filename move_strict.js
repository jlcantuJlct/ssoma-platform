const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');
const lines = code.split('\n');

let start = -1, end = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("viewMode === 'digital'")) start = i;
    // The digital block ends precisely here:
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </main>
    //             )}
    if (start !== -1 && i > start + 10 && lines[i].includes(')}')) {
        if (lines[i-1] && lines[i-1].includes('</main>')) {
            end = i;
            break;
        }
    }
}

console.log("Start:", start, "End:", end);

if (start !== -1 && end !== -1) {
    let block = lines.splice(start, end - start + 1);
    
    // Find where the whole component ends
    let insertIdx = lines.length - 1;
    for(let i=lines.length-1; i>=0; i--) {
        if (lines[i].includes('export default function InspectionsPage() {')) {
            break; // Gone too far
        }
        if (lines[i].includes(');')) {
            if (lines[i+1] && lines[i+1].includes('}')) {
                insertIdx = i - 1;
                break;
            }
        }
    }
    
    console.log("Insert Idx:", insertIdx);
    
    // Actually wait, let's insert it before the final `</div>` of the main component return
    let finalDivIdx = -1;
    for(let i=lines.length-1; i>=0; i--) {
        if (lines[i].includes('</div >') || lines[i].includes('</div>')) {
            if (lines[i+1] && lines[i+1].includes(');')) {
                finalDivIdx = i;
                break;
            }
        }
    }
    console.log("Final Div Idx:", finalDivIdx);
    
    if (finalDivIdx !== -1) {
        lines.splice(finalDivIdx, 0, ...block);
        fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
        console.log("Moved successfully.");
    }
}
