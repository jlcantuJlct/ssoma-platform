const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');

const selectHTML = `<select 
                                                            value={observedArea} 
                                                            onChange={e => setObservedArea(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-emerald-500 appearance-none text-sm"
                                                            required={hasObservations}
                                                        >
                                                            <option value="" disabled>Seleccionar Área...</option>
                                                            <option value="Equipos">Equipos (Walter Palacios)</option>
                                                            <option value="Almacén">Almacén (Daniel Poma)</option>
                                                            <option value="Mantenimiento Rutinario">Mantenimiento Rutinario (Gorki Silva)</option>
                                                            <option value="Mantenimiento Periódico">Mantenimiento Periódico (Jhonattan Cardenas)</option>
                                                            <option value="PAD San Clemente">PAD San Clemente (Ebert Yauris)</option>
                                                            <option value="Chancadora">Chancadora (Alex Canales)</option>
                                                            <option value="DME">DME (Pavel Espinoza)</option>
                                                            <option value="Otros">Otros</option>
                                                        </select>`;

const newHTML = `<div className="flex flex-col gap-2 mt-2">
                                                            {['Equipos', 'Almacén', 'Mantenimiento Rutinario', 'Mantenimiento Periódico', 'PAD San Clemente', 'Chancadora', 'DME', 'Otros'].map(areaOption => (
                                                                <label key={areaOption} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                                                                        checked={observedAreas.includes(areaOption)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setObservedAreas([...observedAreas, areaOption]);
                                                                            } else {
                                                                                setObservedAreas(observedAreas.filter(a => a !== areaOption));
                                                                            }
                                                                        }}
                                                                    />
                                                                    {areaOption}
                                                                    {areaOption === 'Equipos' && <span className="text-slate-500 text-xs ml-1">(Walter Palacios)</span>}
                                                                    {areaOption === 'Almacén' && <span className="text-slate-500 text-xs ml-1">(Daniel Poma)</span>}
                                                                    {areaOption === 'Mantenimiento Rutinario' && <span className="text-slate-500 text-xs ml-1">(Gorki Silva)</span>}
                                                                    {areaOption === 'Mantenimiento Periódico' && <span className="text-slate-500 text-xs ml-1">(Jhonattan Cardenas)</span>}
                                                                    {areaOption === 'PAD San Clemente' && <span className="text-slate-500 text-xs ml-1">(Ebert Yauris)</span>}
                                                                    {areaOption === 'Chancadora' && <span className="text-slate-500 text-xs ml-1">(Alex Canales)</span>}
                                                                    {areaOption === 'DME' && <span className="text-slate-500 text-xs ml-1">(Pavel Espinoza)</span>}
                                                                </label>
                                                            ))}
                                                        </div>`;

code = code.replace(selectHTML, newHTML);

code = code.replace("{observedArea === 'Otros' && (", "{observedAreas.includes('Otros') && (");
code = code.replace("required={observedArea === 'Otros'}", "required={observedAreas.includes('Otros')}");

fs.writeFileSync('app/inspections/page.tsx', code, 'utf8');
console.log('Frontend patched!');
