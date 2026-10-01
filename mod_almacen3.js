const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

const signatureBlock = `{/* --- Firmas --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">FIRMA DEL INSPECTOR</label>
                        {firmas.inspectorFirma ? (
                            <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <img src={firmas.inspectorFirma} alt="Firma Inspector" className="w-full h-32 object-contain" />
                                <button onClick={() => setFirmas(prev => ({ ...prev, inspectorFirma: '' }))} className="absolute bottom-2 right-2 text-xs font-bold text-red-500 bg-white px-3 py-1 rounded-full shadow border border-red-100 hover:bg-red-50">Borrar Firma</button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-400 bg-slate-50 transition-colors" onClick={() => { setActiveSignatureField('inspectorFirma'); setShowSignatureModal(true); }}>
                                <span className="text-slate-400 font-bold text-sm">Tocar para firmar</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">FIRMA DEL RESPONSABLE DE ÁREA</label>
                        {firmas.responsableFirma ? (
                            <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <img src={firmas.responsableFirma} alt="Firma Responsable" className="w-full h-32 object-contain" />
                                <button onClick={() => setFirmas(prev => ({ ...prev, responsableFirma: '' }))} className="absolute bottom-2 right-2 text-xs font-bold text-red-500 bg-white px-3 py-1 rounded-full shadow border border-red-100 hover:bg-red-50">Borrar Firma</button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-400 bg-slate-50 transition-colors" onClick={() => { setActiveSignatureField('responsableFirma'); setShowSignatureModal(true); }}>
                                <span className="text-slate-400 font-bold text-sm">Tocar para firmar</span>
                            </div>
                        )}
                    </div>
                </div>`;

const regexSig = new RegExp('{/\\* --- Firma --- \\*/}[\\s\\S]*?{/\\* Modal de Firma \\*/}');
c = c.replace(regexSig, signatureBlock + '\n\n                {/* Modal de Firma */}');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Modified Almacen signatures');
