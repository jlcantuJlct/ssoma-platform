const fs = require('fs');

function patchForm(file) {
    let code = fs.readFileSync(file, 'utf8');

    // 1. Fix Email HTML body
    const oldHtmlRegex = /let htmlBody = bodyWithLink\.replace\(\/\\\\n\/g, '<br>'\)\.replace\(\/\(https\?:\/\/\\[\^\\\\s\\]\+\)\/g, '<a href="\\$1" style="color:#1a73e8;font-weight:bold;">📄 Ver \/ Descargar Reporte<\/a>'\);[\s\S]*?if \(generatedLevantamientoLink\) \{[\s\S]*?\}/;
    const newHtml = `let htmlBody = bodyWithLink
                            .replace(/\\n/g, '<br>')
                            .replace(/\\*(.*?)\\*/g, '<b>$1</b>')
                            .replace(/📎 Enlace al reporte en Drive:<br>(https?:\\/\\/[^\\s<]+)/g, '<br><a href="$1" style="display:inline-block;padding:10px 20px;background-color:#1a73e8;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">📄 Abrir Excel en Drive</a>')
                            .replace(/✅ Enlace de Levantamiento de Observaciones:<br>(https?:\\/\\/[^\\s<]+)/g, '<br><br><a href="$1" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">✅ Ingresar al Levantamiento</a>')
                            .replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" style="color:#1a73e8;">$1</a>');`;
    code = code.replace(oldHtmlRegex, newHtml);

    // 2. Fix initialObservations for the modal
    const emailModalRegex = /<EmailReportModal[\s\S]*?initialObservations=\{observaciones\}/;
    const newEmailModal = `const badItemsRender = Object.entries(checklist).filter(([_, v]) => v === 'NC' || v === 'F');
            const obsTextCombined = badItemsRender.map(([k]) => "- " + k + (itemComments[k] ? ": " + itemComments[k] : "")).join('\\n') + (observaciones ? '\\n\\nOtras observaciones:\\n' + observaciones : '');
            
            return (
                <div className="min-h-screen bg-slate-50 pb-32">
                ...
            <EmailReportModal
                initialObservations={obsTextCombined}`;
    // Wait, replacing in return is tricky. Let's just replace `initialObservations={observaciones}`
    code = code.replace(/initialObservations=\{observaciones\}/, `initialObservations={Object.entries(checklist).filter(([_, v]) => v === 'NC' || v === 'F').map(([k]) => "- " + k + (itemComments[k] ? ": " + itemComments[k] : "")).join('\\n') + (observaciones ? '\\n\\nOtras observaciones:\\n' + observaciones : '')}`);

    fs.writeFileSync(file, code);
    console.log("Patched " + file);
}

patchForm('components/inspections/BotiquinCustomForm.tsx');
patchForm('components/inspections/EstacionEmergenciaCustomForm.tsx');
