const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

// 1. Update the default email message to include the observations
const emailDataRegex = /setEmailData\(\{\s*to: user\?\.email[\s\S]*?fromName: user\?\.name \|\| 'Sistema SSOMA'\s*\}\);/;
const emailDataReplacement = `
                        const obsText = desc ? '\\n\\nSegún la inspección realizada, se informa de las siguientes observaciones:\\n\\n' + desc.replace(/===KIT===/g, '\\n') : '\\n\\nNo se reportaron observaciones adicionales.';
                        setEmailData({
                            to: user?.email || '',
                            cc: responsableLevantamiento ? responsableLevantamiento.email : '',
                            subject: '🚨 Reporte de Inspección: Kit Antiderrame',
                            message: 'Buenas tardes,\\n\\nAdjunto el enlace al reporte de inspección de Kit Antiderrame realizado en ' + (meta.lugar || 'campo') + '.' + extra + obsText + '\\n\\n[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]\\n\\nPor favor, revisar el documento adjunto.\\n\\nSaludos,\\n' + (user?.name || ''),
                            fromEmail: user?.email || 'notificaciones@ssoma.com',
                            fromName: user?.name || 'Sistema SSOMA'
                        });`;

code = code.replace(emailDataRegex, emailDataReplacement);

// 2. Update the HTML formatting when sending the email to make it look beautiful
const htmlRegex = /html: bodyWithLink\.replace\(\/\\n\/g, '<br>'\)\.replace\(\s*\/\(https\?:\\\\\/\\\\\/\[\^\\\\s\]\+\)\/g,\s*'<a href="\$1" style="color:#1a73e8;font-weight:bold;">📄 Abrir Enlace<\/a>'\s*\)/;
const htmlReplacement = `html: bodyWithLink
                                    .replace(/\\n/g, '<br>')
                                    .replace(/\\*(.*?)\\*/g, '<b>$1</b>')
                                    .replace(/📎 Enlace al reporte en Drive:<br>(https?:\\/\\/[^\\s<]+)/g, '<br><a href="$1" style="display:inline-block;padding:10px 20px;background-color:#1a73e8;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">📄 Abrir Excel en Drive</a>')
                                    .replace(/🔗 <b>Enlace para Levantamiento de Observaciones:<\\/b><br>(https?:\\/\\/[^\\s<]+)/g, '<br><br><a href="$1" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">✅ Ingresar al Levantamiento</a>')
                                    .replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" style="color:#1a73e8;">$1</a>')`;

code = code.replace(htmlRegex, htmlReplacement);

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log("Patched email data and html formatting.");
