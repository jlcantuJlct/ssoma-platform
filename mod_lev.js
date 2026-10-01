const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

const targetState = `const [evidencia, setEvidencia] = useState('');`;
const newState = `const [evidencia, setEvidencia] = useState('');
    const [evidenciasMap, setEvidenciasMap] = useState<Record<string, string>>({});`;
c = c.replace(targetState, newState);

const handleFotoStr = `const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setEvidencia(reader.result as string);
        };
        reader.readAsDataURL(file);
    };`;

const newHandleFotoStr = `const handleFoto = (e: React.ChangeEvent<HTMLInputElement>, itemKey?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (itemKey) {
                setEvidenciasMap(prev => ({ ...prev, [itemKey]: reader.result as string }));
            } else {
                setEvidencia(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };`;
c = c.replace(handleFotoStr, newHandleFotoStr);

const originalRender = `{/* Subir evidencia de levantamiento */}
                        <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia del levantamiento (foto) *</label>
                        <div
                            className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 transition-colors mb-4"
                            onClick={() => document.getElementById('foto-levantamiento')?.click()}
                        >
                            {evidencia ? (
                                <img src={evidencia} alt="Evidencia de levantamiento" className="h-full w-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <Camera size={36} />
                                    <span className="text-sm font-bold">Toca para subir la foto</span>
                                </div>
                            )}
                            <input id="foto-levantamiento" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
                        </div>`;

const newRender = `{/* Subir evidencia de levantamiento */}
                        {(() => {
                            const isMulti = finding.moduleName.toLowerCase().includes('maquina');
                            const items = isMulti ? finding.description.split('\\n').filter(Boolean) : [];
                            
                            if (isMulti && items.length > 0) {
                                return (
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia del levantamiento (fotos) *</label>
                                        <div className="space-y-4">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                                                    <p className="text-sm font-semibold text-slate-800 mb-2">{item}</p>
                                                    <div
                                                        className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 transition-colors"
                                                        onClick={() => document.getElementById('foto-lev-' + idx)?.click()}
                                                    >
                                                        {evidenciasMap[item] ? (
                                                            <img src={evidenciasMap[item]} alt="Evidencia" className="h-full w-full object-cover rounded-lg" />
                                                        ) : (
                                                            <div className="text-slate-400 flex flex-col items-center gap-1">
                                                                <Camera size={24} />
                                                                <span className="text-xs font-bold">Subir foto para esta observación</span>
                                                            </div>
                                                        )}
                                                        <input id={'foto-lev-' + idx} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFoto(e, item)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia del levantamiento (foto) *</label>
                                    <div
                                        className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 transition-colors mb-4"
                                        onClick={() => document.getElementById('foto-levantamiento')?.click()}
                                    >
                                        {evidencia ? (
                                            <img src={evidencia} alt="Evidencia de levantamiento" className="h-full w-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-2">
                                                <Camera size={36} />
                                                <span className="text-sm font-bold">Toca para subir la foto</span>
                                            </div>
                                        )}
                                        <input id="foto-levantamiento" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFoto(e)} />
                                    </div>
                                </>
                            );
                        })()}`;

c = c.replace(originalRender, newRender);

const payloadSubmit = `evidenciaLevantamiento: evidencia,`;
const newPayloadSubmit = `evidenciaLevantamiento: Object.keys(evidenciasMap).length > 0 ? JSON.stringify(evidenciasMap) : evidencia,`;
c = c.replace(payloadSubmit, newPayloadSubmit);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Updated UI for multiple photos');
