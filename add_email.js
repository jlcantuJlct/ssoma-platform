const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// 1. Add states
const targetStates = `    const [regFirma, setRegFirma] = useState('');

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});`;

const repStates = `    const [regFirma, setRegFirma] = useState('');
    const [sendEmail, setSendEmail] = useState(false);
    const [emailTo, setEmailTo] = useState('');

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});`;

code = code.replace(targetStates, repStates);

// 2. Add UI
const targetUI = `            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button 
                    onClick={submit} 
                    disabled={isSaving}`;

const repUI = `            {/* OPCIONES DE CORREO */}
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
                    disabled={isSaving || (sendEmail && !emailTo)}`;

code = code.replace(targetUI, repUI);

// 3. Update submit
const targetSubmit = `            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`\${moduleName}_\${new Date().getTime()}.xlsx\`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                alert("Excel generado correctamente.");
            } else {
                alert("Error al generar Excel");
            }`;

const repSubmit = `            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const filename = \`\${moduleName}_\${new Date().getTime()}.xlsx\`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();

                if (sendEmail && emailTo) {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = async () => {
                        const base64data = reader.result;
                        try {
                            const mailRes = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: emailTo.split(',').map(e => e.trim()).filter(Boolean),
                                    subject: 'Reporte Digital: ' + moduleName,
                                    text: 'Adjunto se envía el reporte de inspección digital autogenerado por el Sistema SSOMA.',
                                    attachmentBase64: base64data,
                                    filename: filename
                                })
                            });
                            if(mailRes.ok) {
                                alert("Excel descargado y enviado por correo con éxito.");
                            } else {
                                alert("Excel descargado, pero falló el envío de correo. Verifique que los correos sean válidos o que el servicio de correo esté activo.");
                            }
                        } catch (e) {
                            alert("Excel descargado, pero ocurrió un error en el servidor al enviar el correo.");
                        }
                    };
                } else {
                    alert("Excel generado y descargado correctamente.");
                }
            } else {
                alert("Error al generar Excel en el servidor.");
            }`;

code = code.replace(targetSubmit, repSubmit);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Added email feature!');
