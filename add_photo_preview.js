const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

const photoBlock = `                {/* FOTOGRAFÍAS DE HALLAZGOS */}
                <div className="bg-white border-t-4 border-emerald-400 shadow-sm rounded-xl p-5 flex flex-col gap-4 mt-6">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2"><Camera size={18} className="text-emerald-500" /> Evidencia Fotográfica de Hallazgos</h3>
                    
                    {badItemsList.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No hay hallazgos (NC) que requieran fotografía.</p>
                    ) : (
                        <div className="space-y-6">
                            {badItemsList.map(([item, val]) => (
                                <div key={item} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-slate-700 text-sm">{item} <span className="text-xs bg-white border border-slate-300 px-1.5 py-0.5 rounded ml-2">(NC)</span></h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(fotosDefectos[item] || []).map((foto, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                                                <img src={foto} alt={"Foto " + item} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removePhotoDefecto(item, idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">`;

c = c.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">/g, photoBlock);

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Added photo preview block to Almacen form');
