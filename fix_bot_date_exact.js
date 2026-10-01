const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinesCustomForm.tsx', 'utf8');

const regex = /<label className="text-\[10px\] font-black text-slate-400 uppercase">Fecha<\/label>[\s\S]*?<\/div>\s*onChange=\{e => setMeta\(\{\.\.\.meta, fecha: e\.target\.value\}\)\} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" \/>/m;

c = c.replace(regex, `<label className="text-[10px] font-black text-slate-400 uppercase">Fecha y Hora</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" />
                                <input type="time" value={meta.hora || ''} onChange={e => setMeta({...meta, hora: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" />
                            </div>`);

fs.writeFileSync('components/inspections/BotiquinesCustomForm.tsx', c);
console.log("Fixed date block");
