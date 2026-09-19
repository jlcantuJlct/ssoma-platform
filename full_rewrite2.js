const fs = require('fs');
let lines = fs.readFileSync('app/inspections/page.tsx', 'utf8').split('\n');

// 1. Add viewMode state
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('const [showDigitalMenu, setShowDigitalMenu] = useState(false);')) {
        lines[i] = "    const [viewMode, setViewMode] = useState<'menu' | 'fisica' | 'digital'>('menu');";
        break;
    }
}

// 2. Fix digital links
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('`/digital-inspections/${encodeURIComponent(mod.name)}`')) {
        lines[i] = lines[i].replace(
            '`/digital-inspections/${encodeURIComponent(mod.name)}`',
            "(mod.name.includes('Vehículo') ? '/vehicle-inspections' : `/digital-inspections/${encodeURIComponent(mod.name)}/fill`)"
        );
    }
}

// 3. Extract the form block
let formStart = -1, formEnd = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* FORMULARIO DE REGISTRO')) {
        formStart = i;
        for(let j=i; j<lines.length; j++) {
            if (lines[j].includes('</Card>')) {
                formEnd = j;
                break;
            }
        }
        break;
    }
}
let formLines = lines.splice(formStart, formEnd - formStart + 1);
let formStr = formLines.join('\n').replace(/xl:col-span-1/g, 'w-full');

// Also remove the grid div `<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">`
let gridIdx = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">')) {
        gridIdx = i;
        lines.splice(i, 1);
        break;
    }
}

// Remove the `)}` that was closing the form block.
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes(')}')) {
        if (lines[i+1] && lines[i+1].includes('{/* HISTORIAL Y TABLA')) {
            lines.splice(i, 1);
            break;
        }
        if (lines[i+2] && lines[i+2].includes('{/* HISTORIAL Y TABLA')) {
            lines.splice(i, 1);
            break;
        }
        if (lines[i+3] && lines[i+3].includes('{/* HISTORIAL Y TABLA')) {
            lines.splice(i, 1);
            break;
        }
    }
}

// And change history width from col-span-4 to w-full
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('xl:col-span-4') || lines[i].includes('xl:col-span-5')) {
        lines[i] = lines[i].replace(/xl:col-span-4/g, 'w-full').replace(/xl:col-span-5/g, 'w-full');
    }
}

// Remove the `</div>` that closes the grid, it's just before {/* SECTION: METAS Y AVANCE
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* SECTION: METAS Y AVANCE')) {
        // Look backwards for a </div>
        for(let j=i-1; j>i-10; j--) {
            if (lines[j] && lines[j].includes('</div>')) {
                lines.splice(j, 1);
                break;
            }
        }
        break;
    }
}

// 4. Transform the main component structure
// Find where the `<main>` starts
let mainStart = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('<main className="flex-1 overflow-auto p-4 md:p-8">')) {
        mainStart = i;
        break;
    }
}

// Insert viewMode === 'menu' opening and buttons at mainStart
let menuTop = `
            {viewMode === 'menu' && (
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <button onClick={() => setViewMode('fisica')} className="group p-8 bg-slate-900 border border-slate-700 rounded-3xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all text-center flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">Inspección Física</h2>
                                <p className="text-slate-400">Registrar y subir reportes escaneados de inspecciones físicas.</p>
                            </button>

                            <button onClick={() => setViewMode('digital')} className="group p-8 bg-slate-900 border border-slate-700 rounded-3xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all text-center flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">Inspección Digital</h2>
                                <p className="text-slate-400">Llenado directo de formatos inteligentes desde la plataforma web.</p>
                            </button>
                        </div>
`;
lines.splice(mainStart, 2, menuTop); // Replace <main> and <div max-w-1600>

// We need to close the viewMode === 'menu' exactly where the main ends.
// Wait, the main ends around line 2085. Let's find `</main>`
let mainEnd = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('</main>') || lines[i].includes('</main >')) {
        mainEnd = i;
        break;
    }
}
let menuBottom = `
                </main>
            )}

            {viewMode === 'fisica' && (
                <main className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
                    <div className="max-w-3xl w-full space-y-6">
                        <button onClick={() => setViewMode('menu')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Volver al Menú
                        </button>
                        ${formStr}
                    </div>
                </main>
            )}
`;
lines.splice(mainEnd, 1, menuBottom);

// Find the digital menu modal and convert it to viewMode === 'digital'
let digitalStart = -1, digitalEnd = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* Modal de Menú Digital */}')) {
        digitalStart = i;
        for(let j=i; j<lines.length; j++) {
            // It ends with a div before the Evidencia Fotográfica modal
            if (lines[j].includes('{/* MODAL DE EVIDENCIA DE INSPECCIÓN */}')) {
                digitalEnd = j - 1;
                break;
            }
        }
        break;
    }
}

if (digitalStart !== -1) {
    let digitalLines = lines.splice(digitalStart, digitalEnd - digitalStart + 1);
    let digitalStr = digitalLines.join('\n');
    
    // Clean it up to use viewMode
    digitalStr = digitalStr.replace(/showDigitalMenu && \(/, "viewMode === 'digital' && (");
    digitalStr = digitalStr.replace(/<div className="fixed inset-0[^>]*>/, '<main className="flex-1 overflow-auto p-4 md:p-8"><div className="max-w-[1200px] mx-auto space-y-6">');
    digitalStr = digitalStr.replace(/<div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-\[90vh\] flex flex-col shadow-2xl"[^>]*>/, '<div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">');
    
    digitalStr = digitalStr.replace(/<div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900\/50 rounded-t-2xl">[\s\S]*?<\/div>/, 
    `<div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            Control de Inspecciones (Digitales)
        </h2>
        <button onClick={() => setViewMode('menu')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver al Menú
        </button>
    </div>`
    );
    
    // Remove the bottom button "Cerrar" div
    digitalStr = digitalStr.replace(/<div className="p-4 border-t border-slate-800 bg-slate-900\/50 rounded-b-2xl flex justify-end">[\s\S]*?<\/div>/, '');
    
    // Fix closing tags for digitalStr
    digitalStr = digitalStr.replace(/<\/div>\s*<\/div>\s*\)\}/, '</div></div></main>)}');
    
    // Inject it back
    lines.splice(digitalStart, 0, digitalStr);
}

fs.writeFileSync('app/inspections/page.tsx', lines.join('\n'));
console.log('Rewrite done safely!');
