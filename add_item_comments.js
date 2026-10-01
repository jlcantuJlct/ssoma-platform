const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

// Add itemComments state
c = c.replace(/const \[observaciones, setObservaciones\] = useState\(''\);/, `const [observaciones, setObservaciones] = useState('');\n    const [itemComments, setItemComments] = useState<Record<string, string>>({});`);

// Add handleItemComment
const handleCheckTarget = `    const handleCheck = (item: string, value: string) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
        
        setObservaciones(prev => {
            let next = prev;
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(NC\\\\)\\\\n?', 'g');
            next = next.replace(regex, '');
            
            if (['NC'].includes(value)) {
                const prefix = '- ' + item + ' (NC)';
                next = next ? next.trim() + '\\n' + prefix : prefix;
            }
            return next.trim();
        });
    };`;

const handleItemCommentFunc = `    const handleItemComment = (item: string, comment: string) => {
        setItemComments(prev => ({ ...prev, [item]: comment }));
        setObservaciones(prev => {
            let next = prev;
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(NC\\\\)(: .*)?\\\\n?', 'g');
            next = next.replace(regex, '');
            if (['NC'].includes(checklist[item])) {
                const prefix = comment ? \`- \${item} (NC): \${comment}\` : \`- \${item} (NC)\`;
                next = next ? next.trim() + '\\n' + prefix : prefix;
            }
            return next.trim();
        });
    };

    const handleCheck = (item: string, value: string) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
        
        setObservaciones(prev => {
            let next = prev;
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp('- ' + escapeRegex(item) + ' \\\\(NC\\\\)(: .*)?\\\\n?', 'g');
            next = next.replace(regex, '');
            
            if (['NC'].includes(value)) {
                const currentComment = itemComments[item];
                const prefix = currentComment ? \`- \${item} (NC): \${currentComment}\` : \`- \${item} (NC)\`;
                next = next ? next.trim() + '\\n' + prefix : prefix;
            }
            return next.trim();
        });
    };`;

// But the regex literal might be slightly different in the file, let's just do a manual replace using string index
const idx = c.indexOf(`    const handleCheck = (item: string, value: string) => {`);
if (idx !== -1) {
    const endIdx = c.indexOf(`    const handlePhotoUploadDefecto`, idx);
    c = c.substring(0, idx) + handleItemCommentFunc + "\n\n" + c.substring(endIdx);
}

// Update toggleDictation
const toggleTarget = `    const toggleDictation = (field: string, isFirma = false) => {
        if (isRecordingMeta === field) {
            recognitionRef.current?.stop();
            setIsRecordingMeta(null);
            return;
        }
        if (recognitionRef.current) {
            setIsRecordingMeta(field);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                const newText = isFirma 
                    ? transcript 
                    : (field === 'observaciones' ? (observaciones ? observaciones + ' ' + transcript : transcript) : transcript);

                if (isFirma) {
                    setFirmas(prev => ({ ...prev, [field]: newText }));
                } else if (field === 'observaciones') {
                    setObservaciones(newText);
                } else {
                    setMeta(prev => ({ ...prev, [field]: newText }));
                    if (field === 'inspector') {
                        setFirmas(prev => ({ ...prev, inspectorNombre: newText }));
                    } else if (field === 'responsable') {
                        setFirmas(prev => ({ ...prev, responsableNombre: newText }));
                    }
                }
            };
            recognitionRef.current.onend = () => setIsRecordingMeta(null);
            recognitionRef.current.start();
        } else {
            alert("El dictado por voz no está soportado en este navegador.");
        }
    };`;

const toggleRep = `    const toggleDictation = (field: string, isFirma = false, isItemComment = false) => {
        if (isRecordingMeta === field) {
            recognitionRef.current?.stop();
            setIsRecordingMeta(null);
            return;
        }
        if (recognitionRef.current) {
            setIsRecordingMeta(field);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                let newText = transcript;
                if (isFirma) {
                    newText = transcript;
                } else if (isItemComment) {
                    const existing = itemComments[field] || '';
                    newText = existing ? existing + ' ' + transcript : transcript;
                } else if (field === 'observaciones') {
                    newText = observaciones ? observaciones + ' ' + transcript : transcript;
                } else {
                    newText = transcript;
                }

                if (isFirma) {
                    setFirmas(prev => ({ ...prev, [field]: newText }));
                } else if (isItemComment) {
                    handleItemComment(field, newText);
                } else if (field === 'observaciones') {
                    setObservaciones(newText);
                } else {
                    setMeta(prev => ({ ...prev, [field]: newText }));
                    if (field === 'inspector') {
                        setFirmas(prev => ({ ...prev, inspectorNombre: newText }));
                    } else if (field === 'responsable') {
                        setFirmas(prev => ({ ...prev, responsableNombre: newText }));
                    }
                }
            };
            recognitionRef.current.onend = () => setIsRecordingMeta(null);
            recognitionRef.current.start();
        } else {
            alert("El dictado por voz no está soportado en este navegador.");
        }
    };`;

c = c.replace(toggleTarget, toggleRep);

// Update rendering of checklist[item] === 'NC'
const renderTarget = `{checklist[item] === 'NC' && (
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                                <input type="file" id={\`foto-\${item}\`} accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUploadDefecto(item, e)} multiple />
                                                <button onClick={() => document.getElementById(\`foto-\${item}\`)?.click()} className="w-full sm:w-auto px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-100 transition-colors">
                                                    <Camera size={14} /> {(fotosDefectos[item]?.length || 0) > 0 ? \`Fotos (\${fotosDefectos[item].length})\` : 'Añadir Foto'}
                                                </button>
                                            </div>
                                        )}`;

const renderRep = `{checklist[item] === 'NC' && (
                                            <div className="w-full mt-3 bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-red-600 uppercase">Detalle y Evidencia:</span>
                                                    <div className="flex gap-2">
                                                        <input type="file" id={\`foto-\${item}\`} accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUploadDefecto(item, e)} multiple />
                                                        <button onClick={() => document.getElementById(\`foto-\${item}\`)?.click()} className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 shadow-sm transition-colors">
                                                            <Camera size={14} /> {(fotosDefectos[item]?.length || 0) > 0 ? \`Fotos (\${fotosDefectos[item].length})\` : 'Añadir Foto'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="text" 
                                                        value={itemComments[item] || ''}
                                                        onChange={e => handleItemComment(item, e.target.value)}
                                                        placeholder="Escriba o dicte el detalle de la observación..."
                                                        className={"w-full text-xs p-2.5 pr-16 rounded-md outline-none border focus:border-red-400 " + (isRecordingMeta === item ? "border-red-400 bg-red-100" : "border-red-200 bg-white")}
                                                    />
                                                    <div className="absolute right-1 flex items-center gap-1">
                                                        {itemComments[item] && (
                                                            <button onClick={() => handleItemComment(item, '')} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors">
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => toggleDictation(item, false, true)} className={"p-1.5 rounded-full transition-colors " + (isRecordingMeta === item ? "text-red-500 bg-red-100 animate-pulse" : "text-slate-400 hover:text-blue-500 hover:bg-slate-100")}>
                                                            <Mic size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}`;

c = c.replace(renderTarget, renderRep);

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Added item-level comments feature with mic and clear button');
