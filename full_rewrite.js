const fs = require('fs');
let content = fs.readFileSync('app/inspections/page.tsx', 'utf8');

// 1. Add viewMode state
content = content.replace(
    'const [showDigitalMenu, setShowDigitalMenu] = useState(false);',
    "const [viewMode, setViewMode] = useState<'menu' | 'fisica' | 'digital'>('menu');"
);

// 2. Fix digital links
content = content.replace(
    /`\/digital-inspections\/\$\{encodeURIComponent\(mod\.name\)\}`/g,
    "(mod.name.includes('Vehículo') ? '/vehicle-inspections' : `/digital-inspections/${encodeURIComponent(mod.name)}/fill`)"
);

// 3. Instead of parsing brackets, we will use string splits for the big sections.
// Section 1: Top of return statement
let parts1 = content.split('<main className="flex-1 overflow-auto p-4 md:p-8">');
let beforeMain = parts1[0];
let insideMain = parts1[1];

// Section 2: Split insideMain into:
// A) Everything before the Grid (Header, Modals, Metas)
// B) The Grid itself (Form + History)
// C) After the grid (Digital Menu Modal + Footer)

let parts2 = insideMain.split('<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">');
let preGrid = parts2[0];
let gridAndAfter = parts2[1];

let parts3 = gridAndAfter.split('{/* Modal de Menú Digital */}');
let gridContent = parts3[0];
let digitalMenuAndFooter = '{/* Modal de Menú Digital */}' + parts3[1];

// Now let's split the gridContent into Form and History
let parts4 = gridContent.split('{/* HISTORIAL Y TABLA (4 Columnas) */}');
let formContent = parts4[0];
let historyContent = '{/* HISTORIAL Y TABLA (4 Columnas) */}' + parts4[1];

// Remove the `</div>` that closes the grid at the end of historyContent
// We know it's right before `{/* SECTION: METAS Y AVANCE`
historyContent = historyContent.replace('</div>\n\n                    {/* SECTION: METAS Y AVANCE', '{/* SECTION: METAS Y AVANCE');

// 4. Construct the new views!

// --- viewMode === 'menu' ---
let menuView = `
            {viewMode === 'menu' && (
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        
                        {/* THE TWO BIG BUTTONS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <button onClick={() => setViewMode('fisica')} className="group p-8 bg-slate-900 border border-slate-700 rounded-3xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all text-center flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                                    <FileText size={48} />
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

                        ${preGrid}

                        <div className="w-full">
                            ${historyContent.replace(/xl:col-span-4/g, 'w-full').replace(/xl:col-span-5/g, 'w-full')}
                        </div>
                    </div>
                </main>
            )}
`;

// --- viewMode === 'fisica' ---
// We will wrap the form content in a nice centered layout
let formView = `
            {viewMode === 'fisica' && (
                <main className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
                    <div className="max-w-3xl w-full space-y-6">
                        <button onClick={() => setViewMode('menu')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Volver al Menú
                        </button>
                        ${formContent.replace(/xl:col-span-1/g, 'w-full')}
                    </div>
                </main>
            )}
`;

// --- viewMode === 'digital' ---
// Extract the inner content of the digital menu modal
let digitalContentMatch = digitalMenuAndFooter.match(/<div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-\[90vh\] flex flex-col shadow-2xl">([\s\S]*?)<\/div>\s*<\/div>\s*\)\}\s*<\/div >/);

let digitalInner = digitalContentMatch ? digitalContentMatch[1] : '';

// Replace the header of the digital modal with a Volver al Menu button
digitalInner = digitalInner.replace(/<div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900\/50 rounded-t-2xl">[\s\S]*?<\/div>/,
'<div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm">' +
    '<h2 className="text-3xl font-black text-white flex items-center gap-3">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>' +
        'Control de Inspecciones (Digitales)' +
    '</h2>' +
    '<button onClick={() => setViewMode(\'menu\')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
        'Volver al Menú' +
    '</button>' +
'</div>'
);

let digitalView = `
            {viewMode === 'digital' && (
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-[1200px] mx-auto space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                            ${digitalInner}
                        </div>
                    </div>
                </main>
            )}
        </div>
`;

let newContent = beforeMain + menuView + formView + digitalView + "\n    );\n}\n";

// Fix some residual closing tags
newContent = newContent.replace(/<div className="p-4 border-t border-slate-800 bg-slate-900\/50 rounded-b-2xl flex justify-end">[\s\S]*?<\/div>/, ''); // Remove the bottom footer of digital modal if any

fs.writeFileSync('app/inspections/page.tsx', newContent);
console.log('Done rewriting!');
