const fs = require('fs');
let file = fs.readFileSync('app/inspections/page.tsx', 'utf8');

// 1. Change state
file = file.replace(
  "const [observedArea, setObservedArea] = useState('');",
  "const [observedAreas, setObservedAreas] = useState<string[]>([]);"
);

// 2. Change clear state calls
file = file.replace(/setObservedArea\(''\)/g, "setObservedAreas([])");

// 3. Change payload 'area: observedArea' to 'areas: observedAreas'
file = file.replace(
  "area: observedArea,",
  "areas: observedAreas,"
);

// 4. Update the UI for the select
const uiOld = `<select 
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
                                                        </select>`;

const uiNew = `<div className="flex flex-wrap gap-2">
                                                            {["Equipos", "Almacén", "Mantenimiento Rutinario", "Mantenimiento Periódico", "PAD San Clemente", "Chancadora", "DME", "SSTMA", "Prevención SSOMA", "Señalización", "Otros"].map(area => (
                                                                <button
                                                                    key={area}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (observedAreas.includes(area)) {
                                                                            setObservedAreas(observedAreas.filter(a => a !== area));
                                                                        } else {
                                                                            setObservedAreas([...observedAreas, area]);
                                                                        }
                                                                    }}
                                                                    className={\`px-3 py-1.5 rounded-full text-xs font-bold transition-colors \${observedAreas.includes(area) ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'}\`}
                                                                >
                                                                    {area}
                                                                </button>
                                                            ))}
                                                        </div>`;

file = file.replace(uiOld, uiNew);

// 5. Update conditional for 'Otros'
file = file.replace(
  "observedArea === 'Otros'",
  "observedAreas.includes('Otros')"
);
file = file.replace(
  "observedArea === 'Otros'",
  "observedAreas.includes('Otros')"
);

fs.writeFileSync('app/inspections/page.tsx', file);
