const fs = require('fs');
const content = fs.readFileSync('components/inspections/ExtinguisherCustomForm.tsx', 'utf-8');

// Find the very first VoiceInput
const idx1 = content.indexOf('const VoiceInput = ({ value, onChange');
// Find ExtinguisherCustomForm
const idx2 = content.indexOf('export const ExtinguisherCustomForm =');

if (idx1 !== -1 && idx2 !== -1) {
    const before = content.substring(0, idx1);
    const after = content.substring(idx2);
    
    const newVoiceInput = const VoiceInput = ({ value, onChange, placeholder, className, type = "text", inputClass = "" }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('El dictado por voz no está soportado en este navegador.');
            return;
        }
        
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            let finalTranscriptAtStart = value || '';
            
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscriptChunk = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                const currentText = finalTranscriptAtStart + (finalTranscriptAtStart && finalTranscriptChunk ? ' ' : '') + finalTranscriptChunk;
                onChange(currentText + (interimTranscript ? ' ' + interimTranscript : ''));
                
                if (finalTranscriptChunk) {
                    finalTranscriptAtStart = currentText;
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
            
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className={\elative w-full \\}>
            {type === 'textarea' ? (
                <textarea 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className={\\ pr-16\}
                />
            ) : (
                <input 
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={\\ \\}
                />
            )}
            {(type === 'text' || type === 'textarea') && (
                <div className={\bsolute right-1 flex items-center \\}>
                    {value && (
                        <button onClick={() => onChange('')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors" title="Limpiar">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button onClick={toggleRecording} className={\p-1.5 rounded-md transition-colors \\} title="Dictado por voz">
                        {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
};

;
    fs.writeFileSync('components/inspections/ExtinguisherCustomForm.tsx', before + newVoiceInput + after);
}
