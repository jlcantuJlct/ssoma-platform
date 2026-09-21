const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const targetMic = `    return (
        <div className="relative w-full">
            {isTextArea ? (
                <textarea className={\`\${className} pr-20\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input className={\`\${className} pr-20\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
            <div className="absolute right-2 top-2 flex items-center gap-1">
                <button type="button" onClick={toggleListen} className={\`p-1.5 rounded-lg transition-colors \${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}\`}>
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button type="button" onClick={() => onChange('')} disabled={!value} className={\`p-1.5 rounded-lg transition-colors \${value ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-500' : 'text-slate-300 opacity-50 cursor-not-allowed'}\`}><Trash2 size={16} /></button>
            </div>
        </div>
    );`;

const repMic = `    return (
        <div className="relative w-full flex items-center">
            {isTextArea ? (
                <textarea className={\`\${className} pr-16\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input className={\`\${className} pr-16\`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
            <div className={\`absolute right-1.5 flex items-center gap-0.5 \${isTextArea ? 'top-2' : ''}\`}>
                <button type="button" onClick={toggleListen} className={\`p-1 rounded transition-colors \${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}\`}>
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <button type="button" onClick={() => onChange('')} disabled={!value} className={\`p-1 rounded transition-colors \${value ? 'text-slate-400 hover:bg-slate-100 hover:text-red-500' : 'text-slate-200 opacity-50 cursor-not-allowed'}\`}><Trash2 size={15} /></button>
            </div>
        </div>
    );`;

code = code.replace(targetMic, repMic);
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Fixed Mic UI!');
