const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

// 1. Add states
const stateInjection = `
    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<any>(null);
    const [responsableLevantamiento, setResponsableLevantamiento] = useState<{name: string, email: string} | null>(null);
    const [contactos, setContactos] = useState<{name: string, email: string}[]>([]);
    useEffect(() => { const stored = localStorage.getItem('ssoma_contacts'); if (stored) setContactos(JSON.parse(stored)); }, []);
`;
code = code.replace(/const \[cachedDriveUrl, setCachedDriveUrl\] = useState<string \| null>\(null\);/, 
    "const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);" + stateInjection);

// 2. Replace handleSaveAndDownload
const newHandleSave = `
    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
        if (kits.length === 0) {
            alert('Añade al menos un Kit evaluado.');
            return;
        }

        setIsSaving(true);
        try {
            const exportKits = kits.map(k => ({
                ...k,
                fotoEvidencia: k.fotosDefectos && k.fotosDefectos.length > 0 ? k.fotosDefectos[0] : ''
            }));

            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Kit Antiderrame',
                    isKitAntiderrameMatrix: true,
                    meta,
                    kits: exportKits,
                    saveToDrive: true
                })
            });

            const badKits = kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F'));

            if (res.ok) {
                const data = await res.json();
                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    
                    const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    
                    if (isEmailing && customEmailData) {
                        try {
                            const driveLink = data.driveUrl || '';
                            const bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                ? customEmailData.message.replace(
                                    '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                    driveLink ? '📎 Enlace al reporte en Drive:\\n' + driveLink : ''
                                )
                                : (driveLink ? customEmailData.message + '\\n\\n📎 Enlace al reporte en Drive:\\n' + driveLink : customEmailData.message);

                            const emailRes = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: customEmailData.to,
                                    cc: customEmailData.cc,
                                    subject: customEmailData.subject,
                                    text: bodyWithLink,
                                    html: bodyWithLink.replace(/\\n/g, '<br>').replace(
                                        /(https?:\\/\\/[^\\s]+)/g,
                                        '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>'
                                    ),
                                    fromEmail: customEmailData.fromEmail,
                                    fromName: customEmailData.fromName
                                })
                            });
                            if (!emailRes.ok) throw new Error('Error enviando correo');
                        } catch (e) {
                            console.error(e);
                            alert('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma.');
                        }
                    } else {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = \`Inspeccion_Kit_Antiderrame_\${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx\`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }

                // Guardar en Registro
                let inspectionRecordId = null;
                try {
                    const dbRes = await fetch('/api/inspections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'create',
                            data: {
                                date: meta.fecha || new Date().toISOString().split('T')[0],
                                responsible: meta.inspector || 'Supervisor SSOMA',
                                inspectionType: 'Kit Antiderrame',
                                area: meta.proyecto || 'RED VIAL 6',
                                zone: meta.lugar || 'Inspección Digital',
                                status: badKits.length > 0 ? 'Abierto' : 'Cerrado',
                                observations: \`\${kits.length} kits inspeccionados. \${badKits.length > 0 ? badKits.length + " con observaciones." : ""}\`,
                                evidencePdf: data.driveUrl || '',
                                evidenceImgs: []
                            }
                        })
                    });
                    const dbData = await dbRes.json();
                    if (dbData?.id) { inspectionRecordId = dbData.id; }
                } catch(err: any) { console.error('Error DB:', err); }

                // Generar Levantamiento
                let generatedLevantamientoLink = null;
                if (responsableLevantamiento && badKits.length > 0) {
                    const respUser = responsableLevantamiento;
                    const desc = "Observaciones de Kits Antiderrame:\\n" + badKits.map((b: any) => \`- \${b.codigo || ""} (\${b.ubicacion || ""}): \${b.observaciones || ""}\`).join("\\n");
                    try {
                        let allFotos: any = {};
                        badKits.forEach((k: any, i: number) => {
                            if (k.fotosDefectos && k.fotosDefectos.length > 0) {
                                allFotos[i.toString()] = k.fotosDefectos[0];
                            }
                        });
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Kit Antiderrame',
                                template: kits,
                                answers: meta,
                                inspectionRecordId,
                                hallazgos: [{
                                    index: 0,
                                    descripcion: desc,
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: respUser?.name || "Responsable",
                                    responsableEmail: respUser?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: allFotos
                                }]
                            })
                        });
                        if (lvRes.ok) {
                            const lvData = await lvRes.json();
                            if (lvData.items && lvData.items.length > 0) {
                                generatedLevantamientoLink = \`\${window.location.origin}/levantamiento/\${lvData.items[0].token}\`;
                                setCachedLevantamientoLink(generatedLevantamientoLink);
                            }
                        }
                    } catch(err) { console.error("Error levantamiento:", err); }
                }

                if (isEmailing) {
                    alert('✅ Reporte generado y enviado con éxito.');
                } else {
                    alert('✅ Reporte generado y descargado con éxito.');
                }
                router.push('/inspections');
            } else {
                alert('Error al conectar con el servidor.');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al exportar.');
        } finally {
            setIsSaving(false);
            setShowEmailModal(false);
        }
    };
`;

const oldHandleSaveRegex = /const handleSaveAndDownload = async \(\) => \{[\s\S]*?setIsSaving\(false\);\s*\n\s*\}\s*\n\s*\};/;
code = code.replace(oldHandleSaveRegex, newHandleSave);

// 3. Inject Asignar Levantamiento UI before Firmas
const asigUI = `
            {/* Panel de Asignación de Levantamiento */}
            {kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F')).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 shadow-sm">
                    <h3 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle size={16} /> Asignar Levantamiento de Observación General
                    </h3>
                    <p className="text-xs text-orange-700 mb-3">
                        Se ha detectado kit(s) con observación. Asigna un responsable para corregir esta situación general.
                    </p>
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-orange-300 px-4 py-3 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all appearance-none cursor-pointer"
                            onChange={(e) => {
                                const c = contactos.find(x => x.email === e.target.value);
                                setResponsableLevantamiento(c || null);
                            }}
                        >
                            <option value="">-- No enviar solicitud de levantamiento --</option>
                            {contactos.map(c => (
                                <option key={c.email} value={c.email}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: FIRMAS */}
`;
code = code.replace(/{[\s\S]*?\/\* SECCIÓN 3: FIRMAS \*\//, asigUI);

// 4. Update the Button and add Modal
const bottomUI = `
            {/* BOTONES DE ACCIÓN */}
            <div className="sticky bottom-4 z-40 flex flex-col gap-2">
                <button onClick={() => {
                    const badKits = kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F'));
                    let extra = '';
                    if (responsableLevantamiento && badKits.length > 0) {
                        extra = '\\n\\nSe ha detectado al menos un equipo con estado No Conforme / Faltante. Se adjuntará el enlace para levantar la observación y responder con la evidencia de reparación.';
                    }
                    setEmailData({
                        to: user?.email || '',
                        cc: responsableLevantamiento ? responsableLevantamiento.email : '',
                        subject: '🚨 Reporte de Inspección: Kit Antiderrame',
                        message: 'Adjunto el enlace al reporte de inspección de Kit Antiderrame realizado en ' + (meta.lugar || 'campo') + '.' + extra + '\\n\\n[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]\\n\\nPor favor, revisar el documento adjunto.\\n\\nSaludos,\\n' + (user?.name || ''),
                        fromEmail: user?.email || 'notificaciones@ssoma.com',
                        fromName: user?.name || 'Sistema SSOMA'
                    });
                    setShowEmailModal(true);
                }} disabled={isSaving} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 text-sm">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                    {isSaving ? 'Generando Reporte...' : 'Enviar Reporte por Correo'}
                </button>
                <button onClick={() => handleSaveAndDownload(false)} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                    {isSaving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {isSaving ? 'Generando Excel...' : 'Finalizar y Descargar (Sin Enviar Correo)'}
                </button>
            </div>

            {showEmailModal && (
                <EmailReportModal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    onSend={(data: any) => handleSaveAndDownload(true, data)}
                    initialData={emailData}
                    isProcessing={isSaving}
                    contactos={contactos}
                />
            )}
        </div>
    );
}
`;

code = code.replace(/<div className="sticky bottom-4 z-40">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}/, bottomUI);

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log('Patch complete.');
