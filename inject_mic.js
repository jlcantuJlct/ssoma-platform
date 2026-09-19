const fs = require('fs');
const file = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure Mic, MicOff, Trash2 are imported
if (!code.includes('MicOff')) {
    code = code.replace(/Camera, Trash2, PlusCircle, Check, Loader2, ChevronDown, ChevronUp, User, MapPin, Clock, Calendar, AlertTriangle, FileText, CheckCircle2/, 'Camera, Trash2, PlusCircle, Check, Loader2, ChevronDown, ChevronUp, User, MapPin, Clock, Calendar, AlertTriangle, FileText, CheckCircle2, Mic, MicOff');
}

// Add TextInputWithMic component before InternasCustomForm
const wrapperComponent = `
const TextInputWithMic = ({ value, onChange, placeholder, className, isTextArea = false }: any) => {
    const [isListening, setIsListening] = useState(false);
    
    const toggleListen = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Su navegador no soporta reconocimiento de voz.');
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) {
                onChange(value + (value ? ' ' : '') + finalTranscript);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
    };

    return (
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
                {value && (
                    <button type="button" onClick={() => onChange('')} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
`;

if (!code.includes('TextInputWithMic')) {
    code = code.replace('export function InternasCustomForm', wrapperComponent + '\nexport function InternasCustomForm');
}

// Replace all standard textareas and inputs with TextInputWithMic where appropriate
code = code.replace(/<input className="(.*?)" value=\{proyecto\} onChange=\{e => setProyecto\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={proyecto} onChange={setProyecto} />');

code = code.replace(/<input className="(.*?)" value=\{direccion\} onChange=\{e => setDireccion\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={direccion} onChange={setDireccion} />');

code = code.replace(/<input className="(.*?)" value=\{area\} onChange=\{e => setArea\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={area} onChange={setArea} />');

code = code.replace(/<input className="(.*?)" value=\{responsableArea\} onChange=\{e => setResponsableArea\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={responsableArea} onChange={setResponsableArea} />');

code = code.replace(/<input placeholder="Nombre completo" className="(.*?)" value=\{r\} onChange=\{e => updateResponsable\(i, e.target.value\)\} \/>/g, 
    '<TextInputWithMic placeholder="Nombre completo" className="$1" value={r} onChange={(val: string) => updateResponsable(i, val)} />');

code = code.replace(/<textarea className="(.*?)" value=\{h.descripcion\} onChange=\{e => updateHallazgo\(h.id, 'descripcion', e.target.value\)\} placeholder="(.*?)" \/>/g, 
    '<TextInputWithMic isTextArea={true} className="$1" value={h.descripcion} onChange={(val: string) => updateHallazgo(h.id, \'descripcion\', val)} placeholder="$2" />');

code = code.replace(/<textarea className="(.*?)" value=\{h.accion\} onChange=\{e => updateHallazgo\(h.id, 'accion', e.target.value\)\} placeholder="(.*?)" \/>/g, 
    '<TextInputWithMic isTextArea={true} className="$1" value={h.accion} onChange={(val: string) => updateHallazgo(h.id, \'accion\', val)} placeholder="$2" />');

code = code.replace(/<input className="(.*?)" value=\{h.responsable\} onChange=\{e => updateHallazgo\(h.id, 'responsable', e.target.value\)\} placeholder="(.*?)" \/>/g, 
    '<TextInputWithMic className="$1" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, \'responsable\', val)} placeholder="$2" />');

code = code.replace(/<textarea className="(.*?)" value=\{conclusiones\} onChange=\{e => setConclusiones\(e.target.value\)\} placeholder="(.*?)" \/>/g, 
    '<TextInputWithMic isTextArea={true} className="$1" value={conclusiones} onChange={setConclusiones} placeholder="$2" />');

code = code.replace(/<input className="(.*?)" value=\{regNombre\} onChange=\{e => setRegNombre\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={regNombre} onChange={setRegNombre} />');

code = code.replace(/<input className="(.*?)" value=\{regCargo\} onChange=\{e => setRegCargo\(e.target.value\)\} \/>/g, 
    '<TextInputWithMic className="$1" value={regCargo} onChange={setRegCargo} />');

fs.writeFileSync(file, code);
console.log("Injected VoiceInput to all text fields!");
