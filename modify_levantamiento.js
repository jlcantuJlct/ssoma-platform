const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

const target1 = `                        {/* Subir evidencia de levantamiento */}
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

const rep1 = `                        {/* Múltiples evidencias de levantamiento */}
                        {finding.description.split('\\n').filter(Boolean).map((itemDesc, idx) => (
                            <div key={idx} className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia: {itemDesc.split(':')[0]} *</label>
                                <div
                                    className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 transition-colors mb-2"
                                    onClick={() => document.getElementById(\`foto-levantamiento-\${idx}\`)?.click()}
                                >
                                    {evidenciasMap[itemDesc] ? (
                                        <img src={evidenciasMap[itemDesc]} alt="Evidencia de levantamiento" className="h-full w-full object-cover rounded-xl" />
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center gap-2">
                                            <Camera size={36} />
                                            <span className="text-sm font-bold">Subir foto para esta observación</span>
                                        </div>
                                    )}
                                    <input 
                                        id={\`foto-levantamiento-\${idx}\`} 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                if (!event.target?.result) return;
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    let width = img.width;
                                                    let height = img.height;
                                                    const maxDim = 800;
                                                    if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
                                                    else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                                                    canvas.width = width; canvas.height = height;
                                                    const ctx = canvas.getContext('2d');
                                                    ctx?.drawImage(img, 0, 0, width, height);
                                                    const b64 = canvas.toDataURL('image/jpeg', 0.8);
                                                    setEvidenciasMap(prev => ({...prev, [itemDesc]: b64}));
                                                    setEvidencia(b64); // fallback legacy
                                                };
                                                img.src = event.target.result as string;
                                            };
                                            reader.readAsDataURL(file);
                                        }} 
                                    />
                                </div>
                            </div>
                        ))}`;

c = c.replace(target1, rep1);

const target2 = `body: JSON.stringify({ evidencia, comentario })`;
const rep2 = `body: JSON.stringify({ evidencia: Object.keys(evidenciasMap).length > 0 ? JSON.stringify(evidenciasMap) : evidencia, comentario })`;
c = c.replace(target2, rep2);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Modified levantamiento UI to support split items');
