const fs = require('fs');
const file = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix Trash icon to be always visible
code = code.replace(
    /\{value && \(\s*<button type="button" onClick=\{[^}]+\} className="[^"]+">\s*<Trash2 size=\{16\} \/>\s*<\/button>\s*\)\}/,
    `<button type="button" onClick={() => onChange('')} disabled={!value} className={\`p-1.5 rounded-lg transition-colors \${value ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-500' : 'text-slate-300 opacity-50 cursor-not-allowed'}\`}><Trash2 size={16} /></button>`
);

// 2. Add the new state variables
const stateTarget = `const [fecha, setFecha] = useState('');`;
const newStateVars = `
    const [razonSocial, setRazonSocial] = useState('Construcción y Administración S.A.');
    const [ruc, setRuc] = useState('20109565017');
    const [domicilio, setDomicilio] = useState('Av. Javier Prado Este Nro. 4109 - Santiago de Surco - Lima');
    const [actividad, setActividad] = useState('Ingeniería / Construcción');
    const [trabajadores, setTrabajadores] = useState('');
`;
code = code.replace(stateTarget, stateTarget + '\n' + newStateVars);

// 3. Add fields to payload
const templateTarget = `{ text: 'Proyecto:', type: 'question' }, { text: 'Dirección:', type: 'question' },`;
const newTemplate = `{ text: 'Razon:', type: 'question' }, { text: 'Ruc:', type: 'question' }, { text: 'Domicilio:', type: 'question' }, { text: 'Actividad:', type: 'question' }, { text: 'Trabajadores:', type: 'question' },\n                    ` + templateTarget;
code = code.replace(templateTarget, newTemplate);

const answerTarget = `{ text: proyecto }, { text: direccion }, { text: responsableArea }, { text: area },`;
const newAnswer = `{ text: razonSocial }, { text: ruc }, { text: domicilio }, { text: actividad }, { text: trabajadores },\n                    ` + answerTarget;
code = code.replace(answerTarget, newAnswer);

// 4. Rename Conclusiones Finales
code = code.replace(/<h3 className="text-lg">Conclusiones Finales<\/h3>/g, '<h3 className="text-lg">Conclusiones y Recomendaciones</h3>');

// 5. Inject UI fields into Datos Generales
const uiTarget = `<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proyecto</label>`;
const newUi = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5 border-b pb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razón Social</label>
                                <TextInputWithMic className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" value={razonSocial} onChange={setRazonSocial} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RUC</label>
                                <TextInputWithMic className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" value={ruc} onChange={setRuc} />
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Trabajadores</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" value={trabajadores} onChange={e => setTrabajadores(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Domicilio</label>
                                <TextInputWithMic className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" value={domicilio} onChange={setDomicilio} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actividad Económica</label>
                                <TextInputWithMic className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" value={actividad} onChange={setActividad} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proyecto</label>`;
code = code.replace(uiTarget, newUi);

fs.writeFileSync(file, code);
console.log("UI updated!");
