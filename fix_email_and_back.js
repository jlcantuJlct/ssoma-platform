const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// 1. Add EmailReportModal and ArrowLeft imports
// Look for lucide-react import and add EmailReportModal after it
if (!code.includes("import { EmailReportModal }")) {
    const importRegex = /import \{[^}]+\} from "lucide-react";/;
    code = code.replace(importRegex, (match) => {
        let newMatch = match.replace('Trash2, ', 'Trash2, ArrowLeft, Mail, ').replace('MicOff }', 'MicOff, Save }'); // added ArrowLeft, Mail, Save if missing
        return `${newMatch}\nimport { EmailReportModal } from '@/components/EmailReportModal';\nimport { useRouter } from 'next/navigation';`;
    });
}

// 2. Add router and modal state
const stateTarget = `    const [regFirma, setRegFirma] = useState('');
    const [sendEmail, setSendEmail] = useState(false);
    const [emailTo, setEmailTo] = useState('');`;

const stateReplacement = `    const [regFirma, setRegFirma] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const router = useRouter();`;

if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplacement);
}

// 3. Add Back Button to top
const topTarget = `<div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden mt-6">`;
const topReplacement = `<div className="max-w-6xl mx-auto mb-6">
                <button 
                    onClick={() => router.push('/inspections?openDigital=true')} 
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden mt-6">`;

if (code.includes(topTarget) && !code.includes("Volver")) {
    code = code.replace(topTarget, topReplacement);
}

// 4. Replace footer buttons and add Modal
const footerTarget = `            {/* OPCIONES DE CORREO */}
            <div className="flex flex-col gap-4 py-4 border-t border-slate-200 mt-6">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="sendEmail" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300" />
                    <label htmlFor="sendEmail" className="text-sm font-bold text-slate-700 cursor-pointer">Enviar copia por correo electrónico (adjuntará el Excel final)</label>
                </div>
                {sendEmail && (
                    <div className="flex flex-col gap-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <label className="text-xs font-bold text-indigo-800 uppercase">Correos Destinatarios (Sepárelos por coma)</label>
                        <TextInputWithMic className="w-full border border-indigo-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={emailTo} onChange={(val: string) => setEmailTo(val)} placeholder="ejemplo@empresa.com, gerente@empresa.com" />
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button 
                    onClick={submit} 
                    disabled={isSaving || (sendEmail && !emailTo)}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Generar Excel de Inspecciones Internas
                </button>
            </div>`;

const footerReplacement = `            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-6 pt-4 border-t border-slate-200">
                <button onClick={submit} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-transform active:scale-95 disabled:opacity-50">
                    {isSaving && !showEmailModal ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving && !showEmailModal ? 'Generando Excel...' : 'Finalizar y Descargar Excel'}
                </button>
                <button onClick={() => setShowEmailModal(true)} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 disabled:opacity-50">
                    {isSaving && showEmailModal ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
                    {isSaving && showEmailModal ? 'Generando...' : 'Enviar por Correo'}
                </button>
            </div>
            
            <EmailReportModal
                initialObservations={conclusiones || ""} 
                isOpen={showEmailModal} 
                onClose={() => setShowEmailModal(false)}
                isSending={isSaving}
                onSend={async (data) => {
                    // Start saving process but send email after Excel is generated
                    setIsSaving(true);
                    
                    const moduleName = "Inspecciones Internas SSOMA";
                    const payload = {
                        proyecto, direccion, responsableArea, area, tipo, otrosTipo, fecha, hora, responsables, hallazgos, conclusiones, regNombre, regCargo, regFecha, regFirma
                    };

                    try {
                        const res = await fetch('/api/export-excel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ moduleName, version, saveToDrive: false, ...payload })
                        });

                        if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            const filename = \`\${moduleName}_\${new Date().getTime()}.xlsx\`;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();

                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = async () => {
                                const base64data = reader.result;
                                try {
                                    const emailRes = await fetch('/api/send-email', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            to: data.to,
                                            cc: data.cc,
                                            subject: data.subject,
                                            text: data.message,
                                            attachmentBase64: base64data,
                                            filename: filename,
                                            fromEmail: data.fromEmail,
                                            fromName: data.fromName
                                        })
                                    });
                                    if(emailRes.ok) {
                                        alert("✅ Excel descargado y enviado por correo con éxito.");
                                    } else {
                                        alert("❌ Excel descargado, pero falló el envío de correo.");
                                    }
                                } catch (e) {
                                    alert("❌ Ocurrió un error en el servidor al enviar el correo.");
                                } finally {
                                    setIsSaving(false);
                                    setShowEmailModal(false);
                                }
                            };
                        } else {
                            alert("Error al generar Excel en el servidor.");
                            setIsSaving(false);
                            setShowEmailModal(false);
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Error al exportar");
                        setIsSaving(false);
                        setShowEmailModal(false);
                    }
                }}
            />`;

if (code.includes("OPCIONES DE CORREO")) {
    code = code.replace(footerTarget, footerReplacement);
}

// 5. Cleanup the submit function's inline email sending if it's there
const inlineEmailStart = `                if (sendEmail && emailTo) {`;
const inlineEmailEnd = `                } else {
                    alert("Excel generado y descargado correctamente.");
                }`;

if (code.includes(inlineEmailStart)) {
    const startIdx = code.indexOf(inlineEmailStart);
    const endIdx = code.indexOf(inlineEmailEnd, startIdx) + inlineEmailEnd.length;
    const blockToReplace = code.substring(startIdx, endIdx);
    
    code = code.replace(blockToReplace, `                alert("Excel generado correctamente.");`);
}


fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Successfully updated to standard Email Modal and Back button!');
