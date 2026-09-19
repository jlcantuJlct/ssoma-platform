const fs = require('fs');

let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

// 1. Fix link to /fill
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('a href={mod.status === \'active\' ? `/digital-inspections/${encodeURIComponent(mod.name)}` : "#"}')) {
        lines[i] = lines[i].replace(
            '`/digital-inspections/${encodeURIComponent(mod.name)}`',
            '(mod.name.includes(\'Vehículo\') ? "/vehicle-inspections" : `/digital-inspections/${encodeURIComponent(mod.name)}/fill`)'
        );
    }
}

// 2. Identify Blocks
function findBlock(startStr, endStrFunc) {
    let start = -1, end = -1;
    for(let i=0; i<lines.length; i++) {
        if (lines[i].includes(startStr)) {
            start = i;
            for(let j=i; j<lines.length; j++) {
                if (endStrFunc(lines[j], j)) {
                    end = j;
                    break;
                }
            }
            break;
        }
    }
    return {start, end};
}

const header = findBlock('{/* Header */}', (l) => l.includes('{/* Modal de Detalle de Programa */}'));
// Modal de Detalle and Configuración de Metas should probably also go with the Header since they are tied to its buttons
const modals = findBlock('{/* Modal de Detalle de Programa */}', (l) => l.includes('<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">'));
const form = findBlock('FORMULARIO DE REGISTRO (1 Columna)', (l) => l.includes('</Card>'));
const history = findBlock('{/* HISTORIAL Y TABLA (4 Columnas) */}', (l, idx) => l.includes('</div>') && lines[idx+1] && lines[idx+1].includes('{/* SECTION: METAS Y AVANCE'));
const goals = findBlock('{/* SECTION: METAS Y AVANCE', (l, idx) => l.includes('</div>') && lines[idx-1] && lines[idx-1].includes('</div>') && lines[idx-2] && lines[idx-2].includes('</div>') && lines[idx-3] && lines[idx-3].includes('</div>'));

// We need to carefully re-arrange the content.
// The structure we want:
//
// viewMode === 'menu':
// - The two buttons
// - HEADER
// - MODALS (Detalle Programa, Config Metas)
// - METAS Y AVANCES (Goals)
// - HISTORIAL Y TABLA (History + Filters)
//
// viewMode === 'fisica':
// - VOLVER AL MENÚ button (added manually)
// - FORM (Nueva Inspección)

// I will write this more precisely by extracting the pieces, and replacing the bodies.
