const fs = require('fs');

let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

// 1. Add viewMode state
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('const [showDigitalMenu, setShowDigitalMenu] = useState(false);')) {
        lines[i] = "    const [viewMode, setViewMode] = useState<'menu' | 'fisica' | 'digital'>('menu');";
        break;
    }
}

// 2. Fix the link in digital inspections
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('`/digital-inspections/${encodeURIComponent(mod.name)}`')) {
        lines[i] = lines[i].replace(
            '`/digital-inspections/${encodeURIComponent(mod.name)}`',
            "(mod.name.includes('Vehículo') ? '/vehicle-inspections' : `/digital-inspections/${encodeURIComponent(mod.name)}/fill`)"
        );
    }
}

// 3. Extract FORMULARIO DE REGISTRO
let formStart = -1, formEnd = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* FORMULARIO DE REGISTRO')) formStart = i;
    if (formStart !== -1 && lines[i].includes('</Card>')) { formEnd = i; break; }
}
let formLines = lines.splice(formStart, formEnd - formStart + 1);
// Also remove the grid wrapper around it and the history table
// The grid wrapper is `<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">`
let gridStart = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">')) {
        gridStart = i;
        lines.splice(i, 1);
        break;
    }
}
// Remove the closing div of the grid. It's right after `HISTORIAL Y TABLA` ends.
let histEnd = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('HISTORIAL Y TABLA')) {
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes('</div>')) {
                // Not that simple, there are many divs.
            }
        }
    }
}

// Actually, rewriting the whole structure via regex is brittle.
// I will just open page.tsx and rewrite the necessary structure in place via string replacement of huge blocks!
