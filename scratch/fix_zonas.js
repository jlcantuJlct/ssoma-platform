const fs = require('fs');
const file = 'app/gestion-residuos/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

const replacement = `                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Zonas / Proyectos (Selección Múltiple)</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {SSOMA_LOCATIONS.map(l => (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedZones(prev => 
                                                        prev.includes(l) ? prev.filter(z => z !== l) : [...prev, l]
                                                    );
                                                }}
                                                className={\`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors \${
                                                    selectedZones.includes(l) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                                                }\`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>`;

content = content.replace(/<div className="space-y-1 md:col-span-2">\s*<label className="text-\[10px\].*?Zonas.*?<\/label>\s*<\/div>\s*<\/div>/g, replacement);

fs.writeFileSync(file, content);
