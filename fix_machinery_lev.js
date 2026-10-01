const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

const oldSaveBlock = "await fetch('/api/inspections', {\n" +
"                    method: 'POST',\n" +
"                    headers: { 'Content-Type': 'application/json' },\n" +
"                    body: JSON.stringify({\n" +
"                        action: 'create',\n" +
"                        data: {\n" +
"                            date: meta.fecha || new Date().toISOString().split('T')[0],\n" +
"                            responsible: meta.chofer || meta.operador || 'Operador',\n" +
"                            inspectionType: 'Maquinaria',\n" +
"                            area: meta.proyecto || 'RED VIAL 6',\n" +
"                            zone: meta.equipo || 'Inspección Digital',\n" +
"                            status: 'Completado',\n" +
"                            observations: observaciones || 'Pre-uso de maquinaria generado.',\n" +
"                            evidencePdf: data.driveUrl || '',\n" +
"                            evidenceImgs: []\n" +
"                        }\n" +
"                    })\n" +
"                });";

const newSaveBlock = `const recRes = await fetch('/api/inspections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create',
                        data: {
                            date: meta.fecha || new Date().toISOString().split('T')[0],
                            responsible: meta.chofer || meta.operador || 'Operador',
                            inspectionType: 'Maquinaria',
                            area: meta.proyecto || 'RED VIAL 6',
                            zone: meta.equipo || 'Inspección Digital',
                            status: 'Completado',
                            observations: observaciones || 'Pre-uso de maquinaria generado.',
                            evidencePdf: data.driveUrl || '',
                            evidenceImgs: []
                        }
                    })
                });
                let inspectionRecordId = null;
                if (recRes.ok) {
                    const recData = await recRes.json();
                    inspectionRecordId = recData.id;
                }

                const badItemsList = Object.entries(checklist).filter(([_, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val));
                let generatedLevantamientoLink = cachedLevantamientoLink;

                if (badItemsList.length > 0 && !generatedLevantamientoLink) {
                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Maquinaria',
                                template: checklist,
                                answers: meta,
                                inspectionRecordId,
                                hallazgos: [{
                                    index: 0,
                                    descripcion: observaciones || "Observaciones de Maquinaria",
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: firmas.capatazNombre || user?.name || "Capataz",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
                                }]
                            })
                        });
                        if (lvRes.ok) {
                            const lvData = await lvRes.json();
                            if (lvData.items && lvData.items.length > 0) {
                                generatedLevantamientoLink = window.location.origin + '/levantamiento/' + lvData.items[0].token;
                                setCachedLevantamientoLink(generatedLevantamientoLink);
                            }
                        }
                    } catch(err) { console.error("Error generating levantamiento:", err); }
                }`;

c = c.replace(oldSaveBlock, newSaveBlock);

// Now fix the email blocks to include generatedLevantamientoLink
// 1. in isEmailing
const oldEmail1 = `const bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
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
                            });`;

const newEmail1 = `let bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                ? customEmailData.message.replace(
                                    '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                    driveLink ? '📎 Enlace al reporte en Drive:\\n' + driveLink : ''
                                )
                                : (driveLink ? customEmailData.message + '\\n\\n📎 Enlace al reporte en Drive:\\n' + driveLink : customEmailData.message);

                            if (generatedLevantamientoLink) {
                                bodyWithLink += '\\n\\n✅ Enlace de Levantamiento de Observaciones:\\n' + generatedLevantamientoLink;
                            }

                            let htmlBody = bodyWithLink.replace(/\\n/g, '<br>').replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>');
                            
                            if (generatedLevantamientoLink) {
                                htmlBody += '<br><br><p style="text-align:center;background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #bbf7d0;"><a href="' + generatedLevantamientoLink + '" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px;">✅ Ingresar para Levantar Observaciones</a></p>';
                            }

                            const emailRes = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: customEmailData.to,
                                    cc: customEmailData.cc,
                                    subject: customEmailData.subject,
                                    text: bodyWithLink,
                                    html: htmlBody,
                                    fromEmail: customEmailData.fromEmail,
                                    fromName: customEmailData.fromName
                                })
                            });`;

c = c.replace(oldEmail1, newEmail1);

// 2. in onSend
const oldEmail2 = `const bodyWithLink = data.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                      ? data.message.replace('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]', '📎 Enlace al reporte en Drive:\\n' + cachedDriveUrl)
                                      : data.message + '\\n\\n📎 Enlace al reporte en Drive:\\n' + cachedDriveUrl;
                                  
                                  const emailRes = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          to: data.to, cc: data.cc, subject: data.subject,
                                          text: bodyWithLink,
                                          html: bodyWithLink.replace(/\\n/g, '<br>').replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>'),
                                          fromEmail: data.fromEmail, fromName: data.fromName
                                      })
                                  });`;

const newEmail2 = `let bodyWithLink = data.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                      ? data.message.replace('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]', '📎 Enlace al reporte en Drive:\\n' + cachedDriveUrl)
                                      : data.message + '\\n\\n📎 Enlace al reporte en Drive:\\n' + cachedDriveUrl;
                                  
                                  if (cachedLevantamientoLink) {
                                      bodyWithLink += '\\n\\n✅ Enlace de Levantamiento de Observaciones:\\n' + cachedLevantamientoLink;
                                  }

                                  let htmlBody = bodyWithLink.replace(/\\n/g, '<br>').replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>');
                                  
                                  if (cachedLevantamientoLink) {
                                      htmlBody += '<br><br><p style="text-align:center;background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #bbf7d0;"><a href="' + cachedLevantamientoLink + '" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px;">✅ Ingresar para Levantar Observaciones</a></p>';
                                  }

                                  const emailRes = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          to: data.to, cc: data.cc, subject: data.subject,
                                          text: bodyWithLink,
                                          html: htmlBody,
                                          fromEmail: data.fromEmail, fromName: data.fromName
                                      })
                                  });`;

c = c.replace(oldEmail2, newEmail2);

// Add missing state for cachedLevantamientoLink
c = c.replace(
    "const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);",
    "const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);\n    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);"
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed Machinery levantamiento creation and email links');
