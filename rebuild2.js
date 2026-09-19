const fs = require('fs');

let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

// Find sections to extract
function extractSection(startHint, endHint) {
    let start = -1;
    for(let i=0; i<lines.length; i++) {
        if (lines[i].includes(startHint)) {
            start = i;
            break;
        }
    }
    if (start === -1) return [];
    
    let end = -1;
    for(let i=start; i<lines.length; i++) {
        if (lines[i].includes(endHint)) {
            end = i;
            break;
        }
    }
    if (end === -1) return [];
    
    // Extract including start and end
    return lines.splice(start, end - start + 1);
}

// 1. Extract Formulario
let formLines = extractSection('FORMULARIO DE REGISTRO', '</Card>');
// Remove the 'xl:col-span-1' so it takes full width of max-w-2xl
formLines = formLines.map(l => l.replace('xl:col-span-1', 'w-full'));

// 2. Extract Modal Menu Digital
// We need to find the start of {/* Modal de Menú Digital */}
let digitalMenuLines = [];
let digStart = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* Modal de Menú Digital */}')) {
        digStart = i;
        break;
    }
}
if (digStart !== -1) {
    // Find where the modal ends. It's an overlay div.
    let count = 0;
    let digEnd = -1;
    for(let j=digStart; j<lines.length; j++) {
        if (lines[j].includes('<div')) count++;
        if (lines[j].includes('</div')) count--;
        if (count === 0 && j > digStart + 5) {
            digEnd = j;
            break;
        }
    }
    digitalMenuLines = lines.splice(digStart, digEnd - digStart + 1);
    
    // Modify the digital menu so it's not a modal, but a main view
    let digStr = digitalMenuLines.join('\n');
    digStr = digStr.replace(/<div className="fixed inset-0[^>]*>/, '<main className="flex-1 overflow-auto p-4 md:p-8"><div className="max-w-[1200px] mx-auto space-y-6">');
    // Remove the inner modal container div
    digStr = digStr.replace(/<div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-\[90vh\] flex flex-col shadow-2xl">/, '');
    
    // We need to fix the closing tags. Instead of closing 2 divs, close 1 main and 1 div.
    // It's easier to just replace the header of the digital menu with a back button.
}

// Write a specialized script for this to avoid string manipulation hell.
