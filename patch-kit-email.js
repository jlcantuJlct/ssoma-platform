const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

// The block to move
const emailBlockRegex = /if \(isEmailing && customEmailData\) \{[\s\S]*?\} else \{[\s\S]*?document\.body\.removeChild\(link\);\s*\n\s*\}/;

const emailBlockMatch = code.match(emailBlockRegex);
if (!emailBlockMatch) {
    console.log("Email block not found!");
    process.exit(1);
}

const emailBlockStr = emailBlockMatch[0];

// Remove it from current position
code = code.replace(emailBlockRegex, `
                    if (!isEmailing) {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = \`Inspeccion_Kit_Antiderrame_\${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx\`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
`);

// Find the end of the Levantamiento block to insert it
const insertRegex = /} catch\(err\) \{ console\.error\("Error levantamiento:", err\); \}\s*\n\s*\}/;

const newEmailBlock = `
                // Inject levantamiento link into email
                if (isEmailing && customEmailData) {
                    try {
                        const driveLink = data.driveUrl || '';
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
                    } catch (e) {
                        console.error(e);
                        alert('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma.');
                    }
                }
`;

code = code.replace(insertRegex, (match) => match + "\n" + newEmailBlock);

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log("Moved email block successfully.");
