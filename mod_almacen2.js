const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

// The states were hardcoded as `proyecto`, `ubicacion`, `codigo`, etc. in Botiquin.
// Let's replace the whole top info grid.
const newGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proyecto */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Proyecto</label>
                        <input type="text" value="RED VIAL 6" disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha de Inspección</label>
                        <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>

                    {/* Área de inspección específica */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Área de inspección específica</label>
                        <input type="text" value={meta.area} onChange={e => setMeta({...meta, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>

                    {/* Inspector */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Inspector</label>
                        <input type="text" value={meta.inspector} onChange={e => setMeta({...meta, inspector: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>

                    {/* Cargo */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Cargo del Inspector</label>
                        <input type="text" value={meta.cargo} onChange={e => setMeta({...meta, cargo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>

                    {/* Responsable de área */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Responsable de Área</label>
                        <input type="text" value={meta.responsable} onChange={e => setMeta({...meta, responsable: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                </div>`;

const gridStart = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;
const gridEndStr = `                </div>

                {/* Tabla de Checklist */}`;
const regex = new RegExp('<div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\\s\\S]*?{/\\* Tabla de Checklist \\*/}');
c = c.replace(regex, newGrid + '\n\n                {/* Tabla de Checklist */}');

// Remove extra states (proyecto, ubicacion, codigo, marca)
c = c.replace(/const \[proyecto, setProyecto\] = useState\('RED VIAL 6'\);\n/g, '');
c = c.replace(/const \[ubicacion, setUbicacion\] = useState\(''\);\n/g, '');
c = c.replace(/const \[codigo, setCodigo\] = useState\(''\);\n/g, '');
c = c.replace(/const \[marca, setMarca\] = useState\(''\);\n/g, '');

// The dbPayload needs updating
c = c.replace(/area: ubicacion/g, 'area: meta.area');
c = c.replace(/zone: codigo/g, 'zone: meta.cargo');
c = c.replace(/answers: \{ \.\.\.meta, observaciones, firmas, fotosDefectos, proyecto, ubicacion, codigo, marca \}/g, 'answers: { ...meta, observaciones, firmas, fotosDefectos }');
c = c.replace(/meta: \{ \.\.\.meta, firmas, fotosDefectos, proyecto, ubicacion, codigo, marca \}/g, 'meta: { ...meta, firmas, fotosDefectos }');
c = c.replace(/isBotiquinMatrix: true/g, 'isAlmacenMatrix: true');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Modified Almacen inputs');
