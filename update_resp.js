const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const targetState = `const [responsables, setResponsables] = useState<string[]>(Array(8).fill(''));`;
const replacementState = `const [responsables, setResponsables] = useState<string[]>(['']);`;

const targetBlock = `<div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">Responsables de la Inspección</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {responsables.map((r, i) => (
                        <input key={i} placeholder={\`Responsable \\\${i+1}\`} className="border border-slate-300 rounded-lg p-2 text-sm" value={r} onChange={e => handleResponsableChange(i, e.target.value)} />
                    ))}
                </div>
            </div>`;

const replacementBlock = `<div className="mb-8">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800">Responsables de la Inspección</h3>
                    {responsables.length < 8 && (
                        <button onClick={() => setResponsables([...responsables, ''])} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <PlusCircle size={16} /> Agregar Responsable
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {responsables.map((r, i) => (
                        <div key={i} className="relative group">
                            <input placeholder={\`Responsable \${i+1}\`} className="w-full border border-slate-300 rounded-lg p-2 text-sm pr-8" value={r} onChange={e => handleResponsableChange(i, e.target.value)} />
                            {responsables.length > 1 && (
                                <button onClick={() => { const newR = [...responsables]; newR.splice(i, 1); setResponsables(newR); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>`;

code = code.replace(targetState, replacementState);
code = code.replace(targetBlock, replacementBlock);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Updated Responsables UI!');
