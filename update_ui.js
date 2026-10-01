const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

// Add to Finding type
c = c.replace(
    /closedAt: string \| null;/g,
    'closedAt: string | null;\n    fotosDefectos?: Record<string, string[]>;'
);

// Replace the upload box UI inside lines.map
const oldBoxRegex = /<label className="block text-sm font-bold text-slate-700 mb-2">Evidencia fotográfica para esta observación \*(.*?)(<label className="block text-sm font-bold text-slate-700 mb-2">Comentario de corrección:)/s;

const newBox = `<div className="flex flex-col md:flex-row gap-4 mb-4">
                                    
                                    {/* Left side: Original photo (if exists) */}
                                    {(() => {
                                        const matchKey = Object.keys(finding.fotosDefectos || {}).find(k => line.replace(/[\\u200B]/g, '').trim().startsWith(k.replace(/[\\u200B]/g, '').trim()));
                                        const origPhotos = matchKey ? finding.fotosDefectos[matchKey] : [];
                                        if (origPhotos && origPhotos.length > 0) {
                                            return (
                                                <div className="w-full md:w-1/2">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Condición observada</p>
                                                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                                        {origPhotos.map((p, i) => (
                                                            <img key={i} src={p} className="h-32 w-auto rounded-lg border border-slate-200 object-cover flex-shrink-0 snap-center shadow-sm" alt="Foto inicial" />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Right side: Upload Levantamiento */}
                                    <div className="w-full flex-1">
                                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1"><Camera size={14}/> Foto del Levantamiento *</p>
                                        
                                        {evidenciasMap[line] || (lines.length === 1 && evidencia) ? (
                                            <div className="relative h-32 mb-2 border-2 border-emerald-400 rounded-xl overflow-hidden shadow-sm">
                                                <img src={evidenciasMap[line] || evidencia} alt="Evidencia" className="h-full w-full object-cover" />
                                                <div className="absolute bottom-2 right-2 flex gap-1.5">
                                                    <button type="button" onClick={() => document.getElementById('foto-levantamiento-' + idx)?.click()} className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 hover:bg-slate-50">🔄 Cambiar</button>
                                                    <button type="button" onClick={() => {
                                                        setEvidenciasMap(p => { const n = {...p}; delete n[line]; return n; });
                                                        if (lines.length === 1) setEvidencia('');
                                                    }} className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 hover:bg-red-600">🗑️ Quitar</button>
                                                </div>
                                                <input id={'foto-levantamiento-' + idx} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFotoMulti(e, line)} />
                                            </div>
                                        ) : (
                                            <div
                                                className="h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors mb-2"
                                                onClick={() => document.getElementById('foto-levantamiento-' + idx)?.click()}
                                            >
                                                <div className="text-slate-400 flex flex-col items-center gap-1">
                                                    <Camera size={28} className="opacity-60" />
                                                    <span className="text-xs font-bold">Toca para tomar foto</span>
                                                </div>
                                                <input id={'foto-levantamiento-' + idx} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFotoMulti(e, line)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <label className="block text-sm font-bold text-slate-700 mb-2">Comentario de corrección:</label>`;

c = c.replace(oldBoxRegex, newBox);
fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed UI in page.tsx');
