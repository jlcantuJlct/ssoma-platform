const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

// 1. Añadir isCheckboxField y actualizar isMetadataField
c = c.replace(
    /const isMetadataField = \(text: string\) => \{[\s\S]*?return keywords\.some\(kw => t\.includes\(kw\)\);\n    \};/,
    `const isCheckboxField = (text: string) => {
        const t = text.toLowerCase().trim();
        return t === 'inspección planificada' || t === 'inspección no planificada' || t === 'otro';
    };

    const isMetadataField = (text: string) => {
        const t = text.toLowerCase().trim();
        const keywords = ['proyecto', 'inspector', 'responsable', 'ubicación', 'ubicacion', 'observaciones', 'razón social', 'razon social', 'domicilio', 'cargo', 'fecha', 'hora', 'código', 'codigo', 'versión', 'version', 'conductor', 'placa', 'kilometraje', 'turno', 'empresa'];
        return keywords.some(kw => t.includes(kw));
    };`
);

// 2. Actualizar variables de renderizado
c = c.replace(
    /const isChecklistField = !isMetadataField\(item\.text\) && !requiresConforme;/,
    `const isCheckbox = isCheckboxField(item.text);
                        const isChecklistField = !isMetadataField(item.text) && !requiresConforme && !isCheckbox;`
);

// 3. Reemplazar el return principal
const targetStart = c.indexOf('return (\n                            <div key={idx} className={`bg-white');
const targetEnd = c.indexOf('}\n                            </div>\n                        );\n                    })}\n                </div>');

if (targetStart > -1 && targetEnd > -1) {
    const replacement = `return (
                            <div key={idx} className={\`bg-white \${isChecklistField ? 'border-b border-slate-200 shadow-sm py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3' : isCheckbox ? 'border-b border-slate-100 py-3 flex items-center justify-between' : 'border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4 relative mb-4'}\`}>
                                {isCheckbox ? (
                                    <>
                                        <h4 className="font-semibold text-slate-700 text-sm">{displayText}</h4>
                                        <button 
                                            onClick={() => handleAnswerChange(idx, 'text', ans?.text === 'X' ? '' : 'X')}
                                            className={\`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all \${ans?.text === 'X' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent hover:border-blue-400'}\`}
                                        >
                                            <X size={20} className={ans?.text === 'X' ? 'text-white' : 'text-transparent'} />
                                        </button>
                                    </>
                                ) : isChecklistField ? (
                                    <>
                                        <div className="flex-1 flex justify-between items-center gap-2">
                                            <h4 className="font-semibold text-slate-700 text-sm leading-snug">{displayText}</h4>
                                            {requiresPhoto && (
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Adjuntar foto">
                                                    <Camera size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input 
                                                type="number" 
                                                placeholder="Cant." 
                                                value={ans?.quantity || ''}
                                                onChange={(e) => handleAnswerChange(idx, 'quantity', e.target.value)}
                                                className="w-16 p-1.5 text-center text-sm border border-slate-200 rounded outline-none focus:border-blue-500 font-bold text-slate-700"
                                            />
                                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'C')}
                                                    className={\`px-3 py-1.5 rounded font-bold text-xs transition-all \${ans?.text === 'C' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}\`}
                                                >C</button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'NC')}
                                                    className={\`px-3 py-1.5 rounded font-bold text-xs transition-all \${ans?.text === 'NC' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}\`}
                                                >NC</button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'N/A')}
                                                    className={\`px-3 py-1.5 rounded font-bold text-xs transition-all \${ans?.text === 'N/A' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}\`}
                                                >N/A</button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{displayText}</h4>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {requiresPhoto && (
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Adjuntar foto">
                                                        <Camera size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        handleAnswerChange(idx, 'text', '');
                                                        handleAnswerChange(idx, 'isConforme', null);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                    title="Borrar respuesta"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {requiresConforme ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'isConforme', true)}
                                                    className={\`p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all \${ans?.isConforme === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}\`}
                                                >
                                                    <CheckCircle size={18} /> CONFORME
                                                </button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'isConforme', false)}
                                                    className={\`p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all \${ans?.isConforme === false ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}\`}
                                                >
                                                    <AlertCircle size={18} /> NO CONFORME
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <textarea 
                                                    value={ans?.text || ''}
                                                    onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
                                                    placeholder="Escribe o dicta tu respuesta..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-12 min-h-[100px] text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                                                />
                                                <button 
                                                    onClick={() => toggleVoiceRecording(idx)}
                                                    className={\`absolute bottom-3 right-3 p-2 rounded-full transition-colors \${isRecording === idx ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}\`}
                                                    title="Dictar por voz"
                                                >
                                                    {isRecording === idx ? <MicOff size={16} /> : <Mic size={16} />}
                                                </button>
                                            </div>
                                        )}
                                        { (item.text.toLowerCase().includes('cargo') || item.text.toLowerCase().includes('responsable')) && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <h5 className="font-bold text-slate-700 text-sm mb-2">Firma Digital:</h5>
                                                <SignaturePad onSave={(data) => handleAnswerChange(idx, 'signature', data)} />
                                            </div>
                                        )}
                                    </>
                                )}
`;
    const newContent = c.substring(0, targetStart) + replacement + c.substring(targetEnd);
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', newContent);
    console.log('Success!');
} else {
    console.log('Targets not found');
}
