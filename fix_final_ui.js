const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

if (!code.includes("import { EmailReportModal }")) {
    const importRegex = /import \{[^}]+\} from "lucide-react";/;
    code = code.replace(importRegex, (match) => {
        let newMatch = match.replace('Trash2, ', 'Trash2, ArrowLeft, Mail, Save, ').replace('MicOff }', 'MicOff }');
        return `${newMatch}\nimport { EmailReportModal } from '@/components/EmailReportModal';\nimport { useRouter } from 'next/navigation';`;
    });
}

const stateTarget = `    const [regFirma, setRegFirma] = useState('');

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});`;

const stateReplacement = `    const [regFirma, setRegFirma] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const router = useRouter();

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});`;

code = code.replace(stateTarget, stateReplacement);

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

code = code.replace(topTarget, topReplacement);

const footerTarget = `            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button 
                    onClick={submit} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Generar Excel de Inspecciones Internas
                </button>
            </div>
            </div>
        </div>
    );
}`;

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
                    setIsSaving(true);
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
                                            to: data.to, cc: data.cc, subject: data.subject, text: data.message,
                                            attachmentBase64: base64data, filename: filename,
                                            fromEmail: data.fromEmail, fromName: data.fromName
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
                            alert("Error al generar Excel.");
                            setIsSaving(false);
                            setShowEmailModal(false);
                        }
                    } catch (e) {
                        alert("Error de conexión.");
                        setIsSaving(false);
                        setShowEmailModal(false);
                    }
                }}
            />
            </div>
        </div>
        </>
    );
}`;

code = code.replace(footerTarget, footerReplacement);
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Fixed final UI!');
