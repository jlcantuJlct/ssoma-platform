const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinesCustomForm.tsx', 'utf8');

c = c.replace(
    /<input type="date" value=\{meta\.fecha\}/,
    `<div className="grid grid-cols-2 gap-2"><input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /><input type="time" value={meta.hora || ''} onChange={e => setMeta({...meta, hora: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>`
);

// We replaced the entire date input with a grid of date and time, so we need to remove the trailing onChange from the original string match
c = c.replace(
    /onChange=\{e => setMeta\(\{\.\.\.meta, fecha: e\.target\.value\}\)\} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2\.5 outline-none focus:ring-2 focus:ring-emerald-500\/20 focus:border-emerald-500" \/>/,
    ``
);

fs.writeFileSync('components/inspections/BotiquinesCustomForm.tsx', c);
console.log("Added time input");
