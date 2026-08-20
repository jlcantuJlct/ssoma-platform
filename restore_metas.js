const fs = require('fs');

let file = 'C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/inspections/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import ComplianceGauge")) {
  content = content.replace(
    "import SearchableSelect from '@/components/SearchableSelect';",
    "import SearchableSelect from '@/components/SearchableSelect';\nimport ComplianceGauge from '@/components/ComplianceGauge';"
  );
}

const metasBlock = `
                    {/* SECTION: METAS Y AVANCE (3D Gauges) - REPOSICIONADO */}
                    {showGoals && (
                        <div className="animate-in slide-in-from-top-4 duration-500 hidden md:block">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500" />
                                    Avance Mensual (Objetivo 3)
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-6">
                                {RESPONSIBLES.filter(r => r && typeof r === 'string' && r !== 'Jose Luis Cancino' && !r.toLowerCase().includes('gerencia')).map(resp => {
                                    const stats = getProgressStats(resp);

                                    // Determinar Color NEON según reglas de usuario:
                                    // 0% - 80%  -> Rojo Neon (#ef4444)
                                    // 81% - 95% -> Naranja Neon (#f97316)
                                    // 96% - 100%-> Verde Neon (#22c55e)
                                    let gaugeColor = '#ef4444';
                                    if (stats.percent >= 96) {
                                        gaugeColor = '#22c55e';
                                    } else if (stats.percent >= 81) {
                                        gaugeColor = '#f97316';
                                    }

                                    return (
                                        <div key={resp} className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-[2rem] p-4 border border-slate-700/50 shadow-2xl flex flex-col items-center justify-between group hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                            {/* Spotlight Effect */}
                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 blur-xl pointer-events-none"></div>

                                            <ComplianceGauge
                                                title={resp}
                                                value={stats.executed}
                                                max={stats.planned}
                                                width={130}
                                                height={90}
                                                color={gaugeColor}
                                            />
                                            <div className="mt-3 w-full flex justify-between px-2 text-[10px] font-mono font-bold text-slate-500 border-t border-slate-800/50 pt-2">
                                                <span className="flex items-center gap-1">E: <span style={{ color: gaugeColor }} className="text-xs drop-shadow-md">{stats.executed}</span></span>
                                                <span className="flex items-center gap-1">P: <span className="text-slate-300 text-xs">{stats.planned}</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
`;

if (!content.includes("SECTION: METAS Y AVANCE")) {
  content = content.replace(
    '<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">',
    metasBlock + '\n                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">'
  );
}

fs.writeFileSync(file, content);
console.log("Restored Metas section!");
