const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

let start = -1, end = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("viewMode === 'digital' && (")) start = i;
    if (start !== -1 && lines[i].includes('</div></div></main>)}')) { end = i; break; }
}

if (start === -1) {
    console.log("Could not find viewMode === 'digital'");
    process.exit(1);
}

let newDigital = `
            {viewMode === 'digital' && (
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-[1200px] mx-auto space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm">
                                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                                    Control de Inspecciones (Digitales)
                                </h2>
                                <button onClick={() => setViewMode('menu')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    Volver al Menú
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <p className="text-slate-400 mb-6">Selecciona el tipo de inspección digital que deseas realizar o gestionar:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
`;

// Extract the mapping part from the original
let mapStart = -1, mapEnd = -1;
for(let i=start; i<=end; i++) {
    if (lines[i].includes('inspectionModules.map')) mapStart = i;
    if (mapStart !== -1 && lines[i].includes('Crear Nuevo Módulo')) {
        // Need to find the end of the grid
        for(let j=i; j<=end; j++) {
            if (lines[j].includes('</button>')) {
                mapEnd = j;
                break;
            }
        }
        break;
    }
}

let mapContent = lines.slice(mapStart, mapEnd + 1).join('\n');

// Wrap it all
let fullDigital = newDigital + '                                ' + mapContent + '\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </main>\n            )}';

lines.splice(start, end - start + 1, fullDigital);
fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
console.log('Fixed digital section!');
