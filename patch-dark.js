const fs = require('fs');
const filePath = 'app/levantamiento/[token]/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
    [/bg-slate-100/g, "bg-slate-950"],
    [/bg-white(?!(\/| border-slate-300))/g, "bg-slate-900"],
    [/bg-white\/90/g, "bg-slate-800/90"],
    [/text-slate-800/g, "text-slate-100"],
    [/border-slate-200/g, "border-slate-800"],
    [/text-slate-500/g, "text-slate-400"],
    [/text-slate-600/g, "text-slate-300"],
    [/bg-slate-50/g, "bg-slate-800"],
    [/text-slate-700/g, "text-slate-300"],
    [/border-slate-300/g, "border-slate-700"],
    [/bg-emerald-50/g, "bg-emerald-900/30"],
    [/border-emerald-100/g, "border-emerald-800/50"],
    [/bg-blue-50/g, "bg-blue-900/30"],
    [/border-blue-100/g, "border-blue-800/50"],
    [/text-slate-400/g, "text-slate-500"],
    [/hover:bg-slate-50/g, "hover:bg-slate-700"],
    [/hover:bg-slate-200/g, "hover:bg-slate-800"],
    [/bg-white text-slate-600/g, "bg-slate-800 text-slate-300"]
];

replacements.forEach(([regex, replacement]) => {
    code = code.replace(regex, replacement);
});

// For specific exceptions or tweaks
// Fix input background text color
code = code.replace(/className="w-full border border-slate-700 rounded-xl p-3 h-20 resize-none"/, 'className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl p-3 h-20 resize-none"');

fs.writeFileSync(filePath, code);
console.log("Dark mode applied to page.tsx");
