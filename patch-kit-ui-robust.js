const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

const startStr = "    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {";
const endStr = "    };";

const startIndex = code.indexOf(startStr);
if (startIndex === -1) throw new Error("Start string not found");

// Find the corresponding end bracket
let bracketCount = 0;
let endIndex = -1;
let i = startIndex + startStr.length - 1; // start at the {

while (i < code.length) {
    if (code[i] === '{') bracketCount++;
    if (code[i] === '}') {
        bracketCount--;
        if (bracketCount === 0) {
            endIndex = i;
            break;
        }
    }
    i++;
}

if (endIndex === -1) throw new Error("End bracket not found");

const handleSaveNew = `    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
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
                    
                    if (!isEmailing) {
                        const byteCharacters = atob(data.fileBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        
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
                if (!isEmailing) {
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
                }

                // Generar Levantamiento
                let generatedLevantamientoLink = cachedLevantamientoLink;
                if (!isEmailing && responsableLevantamiento && badKits.length > 0) {
                    const respUser = responsableLevantamiento;
                    
                    const hallazgosArray = badKits.map((b: any, index: number) => ({
                        index: index,
                        descripcion: \`Kit \${b.codigo || 'S/N'} (\${b.ubicacion || 'S/U'}): \${b.observaciones || ''}\`,
                        riesgo: 'Medio',
                        categoria: 'Condición Subestándar',
                        responsable: respUser?.name || "Responsable",
                        responsableEmail: respUser?.email || "responsable@casacontratistas.com",
                        fecha: meta.fecha || new Date().toISOString().split('T')[0],
                        fotosDefectos: (b.fotosDefectos && b.fotosDefectos.length > 0) ? { "0": b.fotosDefectos[0] } : {}
                    }));

                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Kit Antiderrame',
                                template: kits,
                                answers: meta,
                                inspectionRecordId,
                                hallazgos: hallazgosArray
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

                // Inject levantamiento link into email
                if (isEmailing && customEmailData) {
                    try {
                        const driveLink = cachedDriveUrl || data.driveUrl || '';
                        let bodyWithLink = customEmailData.message;
                        
                        if (generatedLevantamientoLink) {
                            bodyWithLink += '\\n\\n🔗 *Enlace para Levantamiento de Observaciones:*\\n' + generatedLevantamientoLink;
                        }
                        
                        bodyWithLink = bodyWithLink.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                            ? bodyWithLink.replace(
                                '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                driveLink ? '📎 Enlace al reporte en Drive:\\n' + driveLink : ''
                            )
                            : (driveLink ? bodyWithLink + '\\n\\n📎 Enlace al reporte en Drive:\\n' + driveLink : bodyWithLink);

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
                                    '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Abrir Enlace</a>'
                                ),
                                fromEmail: customEmailData.fromEmail,
                                fromName: customEmailData.fromName
                            })
                        });
                        if (!emailRes.ok) throw new Error('Error enviando correo');
                        alert('✅ Correo enviado exitosamente.');
                        window.location.href = '/inspections?openDigital=true';
                    } catch (e) {
                        console.error(e);
                        alert('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma.');
                    }
                } else {
                    if (window.confirm('¡Descarga y guardado exitoso!\\n\\n1. Por favor abre el Excel descargado.\\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo.\\n3. Si quieres salir al panel, haz clic en "Cancelar".')) {
                        const badK = kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F'));
                        let extra = '';
                        if (responsableLevantamiento && badK.length > 0) {
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
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }
            } else {
                alert('Error al conectar con el servidor.');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al exportar.');
        } finally {
            setIsSaving(false);
            if(isEmailing) setShowEmailModal(false);
        }
    }`;

code = code.substring(0, startIndex) + handleSaveNew + code.substring(endIndex + 1);

// Now patch the buttons
const buttonsStart = code.indexOf("{/* BOTONES DE ACCIÓN */}");
const showEmailModalStart = code.indexOf("{showEmailModal", buttonsStart);

if (buttonsStart === -1 || showEmailModalStart === -1) {
    throw new Error("Could not find buttons block");
}

const newButtons = `            {/* BOTÓN FINALIZAR */}
            <div className="sticky bottom-4 z-40">
                <button 
                    onClick={() => handleSaveAndDownload(false)} 
                    disabled={isSaving} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base"
                >
                    {isSaving && !showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {isSaving && !showEmailModal ? 'Generando Excel...' : 'Finalizar Inspección (Descargar y Guardar)'}
                </button>
            </div>

            `;

code = code.substring(0, buttonsStart) + newButtons + code.substring(showEmailModalStart);

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log("Patched successfully");
