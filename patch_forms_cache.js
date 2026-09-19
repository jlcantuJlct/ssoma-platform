const fs = require('fs');

const files = [
    'components/inspections/BotiquinCustomForm.tsx',
    'components/inspections/EstacionEmergenciaCustomForm.tsx',
    'components/inspections/KitAntiderrameCustomForm.tsx',
    'components/inspections/ExtinguisherCustomForm.tsx',
    'components/inspections/MachineryCustomForm.tsx',
    'components/inspections/EppCustomForm.tsx',
    'app/digital-inspections/[module]/fill/page.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    if (!code.includes('const [cachedDriveUrl, setCachedDriveUrl]')) {
        code = code.replace(/const \[isSaving, setIsSaving\] = useState\(false\);/, 
            'const [isSaving, setIsSaving] = useState(false);\n    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);');
    }
    
    // We need to set cachedDriveUrl at the end of the API call if successful.
    // Instead of doing it deep inside the isEmailing logic, we can do it when we get the response.
    // Let's inject it right after `if (data.fileBase64) {`
    if (!code.includes('setCachedDriveUrl(data.driveUrl)')) {
        code = code.replace(/if \(data\.fileBase64\) \{/g, 
            'if (data.fileBase64) {\n                    setCachedDriveUrl(data.driveUrl);');
    }

    // Now modify the onSend logic inside the EmailReportModal component
    // from: await handleSaveAndDownload(true, data);
    // to: if (cachedDriveUrl) { ... send email directly ... } else { await handleSaveAndDownload(true, data); }
    const oldOnSend = /onSend=\{async \(data\) => \{\s*await handleSaveAndDownload\(true, data\);\s*setShowEmailModal\(false\);\s*\}\}/g;
    
    const newOnSend = `onSend={async (data) => {
                          if (cachedDriveUrl) {
                              setIsSaving(true);
                              try {
                                  const bodyWithLink = data.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
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
                                  });
                                  if (!emailRes.ok) throw new Error('Error enviando correo');
                                  alert('✅ Correo enviado correctamente con el reporte ya revisado.');
                              } catch(e) {
                                  alert('Error al enviar el correo.');
                              } finally {
                                  setIsSaving(false);
                                  setShowEmailModal(false);
                              }
                          } else {
                              await handleSaveAndDownload(true, data);
                              setShowEmailModal(false);
                          }
                      }}`;
                      
    code = code.replace(oldOnSend, newOnSend);

    // Finally, replace the alert with the confirmation dialog
    const alertPattern = /alert\('¡Inspección.*?exitosamente.*?'\);/g;
    const confirmDialog = `if (!isEmailing) {
                    if (window.confirm('¡Descarga y guardado exitoso!\\n\\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo (SIN crear duplicados).\\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    }
                }`;
    code = code.replace(alertPattern, confirmDialog);

    fs.writeFileSync(file, code);
    console.log('Processed', file);
});
