const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// 1. Responsables input
const t1 = `<input placeholder={\`Responsable \${i+1}\`} className="w-full border border-slate-300 rounded-lg p-2 text-sm pr-8" value={r} onChange={e => handleResponsableChange(i, e.target.value)} />`;
const r1 = `<TextInputWithMic placeholder={\`Responsable \${i+1}\`} className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={r} onChange={(val: string) => handleResponsableChange(i, val)} />`;
code = code.replace(t1, r1);

// 2. Acción Correctiva
const t2 = `<textarea className="border border-slate-300 rounded-lg p-2 h-10 text-sm resize-none" value={h.accion} onChange={e => updateHallazgo(h.id, 'accion', e.target.value)} />`;
const r2 = `<TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-lg p-2 h-10 text-sm resize-none" value={h.accion} onChange={(val: string) => updateHallazgo(h.id, 'accion', val)} />`;
code = code.replace(t2, r2);

// 3. Responsable Impl.
const t3 = `<input className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable} onChange={e => updateHallazgo(h.id, 'responsable', e.target.value)} />`;
const r3 = `<TextInputWithMic className="w-full border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, 'responsable', val)} />`;
code = code.replace(t3, r3);

// 4. Conclusiones
const t4 = `<textarea className="w-full border border-slate-300 rounded-xl p-4 h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Escriba aquí las conclusiones finales..." value={conclusiones} onChange={e => setConclusiones(e.target.value)} />`;
const r4 = `<TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-xl p-4 h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Escriba aquí las conclusiones finales..." value={conclusiones} onChange={(val: string) => setConclusiones(val)} />`;
code = code.replace(t4, r4);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Replaced all with TextInputWithMic');
