const fs = require('fs');
let c = fs.readFileSync('app/inspections/page.tsx', 'utf8');

const targetStart = c.indexOf('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">');
const targetEnd = c.indexOf('{/* Modal Opciones de Formato */}');

if (targetStart > -1 && targetEnd > -1) {
    const replacement = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inspectionModules.map((mod, idx) => (
            <div key={idx} className={\`relative group \${mod.status === 'active' ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' : 'bg-slate-900 border-slate-800 border-dashed opacity-70'} border rounded-xl p-5 flex flex-col items-center text-center transition-all\`}>
                {(user?.role === 'developer' || user?.role === 'manager') && (
                    <button 
                        onClick={(e) => { e.preventDefault(); setTargetModule(mod.name); setFormatActionType(mod.status === 'active' ? 'update' : 'new'); setShowFormatOptionsModal(true); }}
                        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Opciones de Formato"
                    >
                        <Settings size={16} />
                    </button>
                )}
                <a href={mod.status === 'active' ? (mod.name.includes('Vehículo') ? "/vehicle-inspections" : \`/digital-inspections/\${encodeURIComponent(mod.name)}\`) : "#"} className="flex flex-col items-center w-full">
                    <div className={\`w-16 h-16 rounded-full flex items-center justify-center mb-4 \${mod.status === 'active' ? 'bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform' : 'bg-slate-500/10 text-slate-500'}\`}>
                        <ClipboardList size={32} />
                    </div>
                    <h4 className={\`font-bold mb-2 text-sm \${mod.status === 'active' ? 'text-white' : 'text-slate-300'}\`}>{mod.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{mod.description}</p>
                    {mod.status !== 'active' && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold uppercase mt-auto">En Configuración</span>}
                </a>
            </div>
        ))}
        <button onClick={() => setShowCreateModuleModal(true)} className="relative group bg-slate-900 border border-slate-800 border-dashed hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[220px]">
            <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors"><Plus size={32} /></div>
            <h4 className="font-bold text-slate-300 mb-2 text-sm group-hover:text-white transition-colors">Crear Nuevo Módulo</h4>
            <p className="text-xs text-slate-500">Añadir otra inspección (Arneses, Escaleras, etc.)</p>
        </button>
    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showCreateModuleModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white">Crear Módulo</h3>
                                    <button onClick={() => setShowCreateModuleModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                                </div>
                                <form onSubmit={handleCreateModule} className="flex flex-col gap-4">
                                    <input type="text" placeholder="Nombre" required value={newModuleData.name} onChange={e => setNewModuleData({...newModuleData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                                    <input type="text" placeholder="Descripción" required value={newModuleData.description} onChange={e => setNewModuleData({...newModuleData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg">Guardar Módulo</button>
                                </form>
                            </div>
                        </div>
                    )}
                    \n`;
    const newContent = c.substring(0, targetStart) + replacement + c.substring(targetEnd);
    fs.writeFileSync('app/inspections/page.tsx', newContent);
    console.log('Success!');
} else {
    console.log('Targets not found');
}
