const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');

// 1. Add state variables
if (!code.includes('const [hasObservations, setHasObservations]')) {
  code = code.replace(
    'const [isUploading, setIsUploading] = useState(false);',
    `const [isUploading, setIsUploading] = useState(false);\n\n    const [hasObservations, setHasObservations] = useState(false);\n    const [observedArea, setObservedArea] = useState('');\n    const [otherObservedArea, setOtherObservedArea] = useState('');`
  );
}

// 2. Reset state variables
code = code.replace(
  /setNewEvidence\({ pdf: '', imgs: \[\] }\);/g,
  `setNewEvidence({ pdf: '', imgs: [] });
                    setHasObservations(false);
                    setObservedArea('');
                    setOtherObservedArea('');`
);

// 3. Add send alert logic
if (!code.includes('fetch(\'/api/send-alert\'')) {
  code = code.replace(
    /saveInspection\(newInspection\)\.then\(res => {[\s\S]*?}\);/,
    `saveInspection(newInspection).then(res => {
                if (!res.success) {
                    console.error("Save error:", res.error);
                    alert("Error al guardar en servidor: " + (res.error || "Error desconocido"));
                } else {
                    if (hasObservations) {
                        fetch('/api/send-alert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                area: observedArea,
                                areaText: otherObservedArea,
                                inspectionLink: newEvidence.pdf || 'https://ssoma-platform.vercel.app/inspections'
                            })
                        }).catch(e => console.error("Error sending alert", e));
                    }
                }
            });`
  );
}

const findStr = '<button\\n                                            type="submit"';
const uiStr = `
                                        {/* CONTROLES DE OBSERVACIONES */}
                                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="hasObs"
                                                    checked={hasObservations}
                                                    onChange={e => setHasObservations(e.target.checked)}
                                                    className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-950 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                                />
                                                <label htmlFor="hasObs" className="text-sm font-bold text-slate-300">¿Contiene observaciones?</label>
                                            </div>
                                            
                                            {hasObservations && (
                                                <div className="pl-6 space-y-3 border-l-2 border-slate-800 ml-2 mt-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-500">Área Responsable</label>
                                                        <select 
                                                            value={observedArea} 
                                                            onChange={e => setObservedArea(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-emerald-500 appearance-none text-sm"
                                                            required={hasObservations}
                                                        >
                                                            <option value="">Seleccionar Área...</option>
                                                            <option value="Equipos">Equipos</option>
                                                            <option value="Almacén">Almacén</option>
                                                            <option value="Mantenimiento Rutinario">Mantenimiento Rutinario</option>
                                                            <option value="Mantenimiento Periódico">Mantenimiento Periódico</option>
                                                            <option value="PAD San Clemente">PAD San Clemente</option>
                                                            <option value="Chancadora">Chancadora</option>
                                                            <option value="DME">DME</option>
                                                            <option value="Otros">Otros (Escribir)</option>
                                                        </select>
                                                    </div>

                                                    {observedArea === 'Otros' && (
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500">Especificar Área / Correo</label>
                                                            <input 
                                                                type="text" 
                                                                value={otherObservedArea}
                                                                onChange={e => setOtherObservedArea(e.target.value)}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-emerald-500 text-sm"
                                                                placeholder="Ej: Contratista externo, etc."
                                                                required={observedArea === 'Otros'}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        `;

if (!code.includes('CONTROLES DE OBSERVACIONES')) {
    // Regex for: <button followed by whitespace and type="submit"
    code = code.replace(/<button\s+type="submit"/, uiStr + '<button\n                                            type="submit"');
    fs.writeFileSync('app/inspections/page.tsx', code, 'utf8');
    console.log('Patched');
} else {
    console.log('Already patched');
}
