const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// The EXACT string of TextInputWithMic currently in the file
const targetMic = `    return (
        <div className="relative w-full">
            {isTextArea ? (
                <textarea className={\`\${className} bg-white text-slate-900 pr-20 transition-colors\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input className={\`\${className} bg-white text-slate-900 pr-20 transition-colors\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
            <div className="absolute right-2 top-2 flex items-center gap-1">
                <button type="button" onClick={toggleListen} className={\`p-1.5 rounded-lg transition-colors \${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}\`}>
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button type="button" onClick={() => onChange('')} disabled={!value} className={\`p-1.5 rounded-lg transition-colors \${value ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-500' : 'text-slate-300 opacity-50 cursor-not-allowed'}\`}><Trash2 size={16} /></button>
            </div>
        </div>
    );`;

// The new simplified and beautiful Mic UI
const repMic = `    return (
        <div className="relative w-full">
            {isTextArea ? (
                <textarea className={\`\${className} pr-16 bg-white text-black\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input className={\`\${className} pr-16 bg-white text-black\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
            <div className={\`absolute right-2 flex items-center gap-1 \${isTextArea ? 'top-2' : 'top-1/2 -translate-y-1/2'}\`}>
                <button type="button" onClick={toggleListen} className={\`p-1 rounded transition-colors \${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-indigo-600'}\`}>
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button type="button" onClick={() => onChange('')} disabled={!value} className={\`p-1 rounded transition-colors \${value ? 'bg-slate-50 text-slate-400 hover:bg-red-100 hover:text-red-600' : 'text-slate-200 opacity-0 cursor-not-allowed'}\`}><Trash2 size={14} /></button>
            </div>
        </div>
    );`;

if (code.includes(targetMic)) {
    code = code.replace(targetMic, repMic);
    fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
    console.log('Fixed Mic UI successfully!');
} else {
    console.log('Target string NOT FOUND! Check the file content.');
}
