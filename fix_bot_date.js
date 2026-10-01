const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinesCustomForm.tsx', 'utf8');

c = c.replace(
    /<div className="grid grid-cols-2 gap-2"><input type="date" value=\{meta\.fecha\} <input type="time".*?\/>/g,
    `<div className="grid grid-cols-2 gap-2"><input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" /><input type="time" value={meta.hora || ''} onChange={e => setMeta({...meta, hora: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" /></div>`
);
c = c.replace(/onChange=\{e => setMeta\(\{\.\.\.meta, fecha: e\.target\.value\}\)\} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" \/>/, "");

fs.writeFileSync('components/inspections/BotiquinesCustomForm.tsx', c);
