const fs = require('fs');
const path = require('path');

const dir = 'components/inspections';
const files = fs.readdirSync(dir).filter(f => f.endsWith('CustomForm.tsx'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    // 1. Add import if not exists
    if (!content.includes('EmailReportModal')) {
        content = content.replace('import { useRouter } from', "import { EmailReportModal } from '@/components/EmailReportModal';\nimport { useRouter } from");
    }

    // 2. Add state
    if (!content.includes('const [showEmailModal, setShowEmailModal] = useState(false);')) {
        content = content.replace('const [isSaving, setIsSaving] = useState(false);', 
            "const [isSaving, setIsSaving] = useState(false);\n    const [showEmailModal, setShowEmailModal] = useState(false);\n    const [emailData, setEmailData] = useState<any>(null);");
    }

    // 3. Modify handleSaveAndDownload signature
    content = content.replace('const handleSaveAndDownload = async () => {', 'const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {');

    // 4. Intercept the download logic
    // Usually it looks like:
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a'); ... a.remove();
    // We will wrap this in if (!isEmailing)
    
    // We need to inject the email sending logic right after getting data.fileBase64
    const emailLogic = 
                    if (isEmailing && customEmailData) {
                        try {
                            const emailRes = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: customEmailData.to,
                                    cc: customEmailData.cc,
                                    subject: customEmailData.subject,
                                    text: customEmailData.message,
                                    attachmentBase64: data.fileBase64,
                                    filename: \\\Reporte_\\\.xlsx\\\
                                })
                            });
                            if (!emailRes.ok) throw new Error('Error al enviar correo');
                        } catch (e) {
                            console.error(e);
                            alert('Hubo un error al enviar el correo, pero el reporte se generó.');
                        }
                    } else {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;;
    
    // Find the url creation and replace it
    content = content.replace(/const url = window\.URL\.createObjectURL\(blob\);\s*const a = document\.createElement\('a'\);\s*a\.href = url;/g, emailLogic);
    // Find the a.remove(); and close the else block
    content = content.replace(/a\.click\(\);\s*a\.remove\(\);/g, "a.click();\n                        a.remove();\n                    }");

    // 5. Add the buttons and the modal
    // Find the save button
    const saveBtnMatch = content.match(/<button[^>]*onClick=\{handleSaveAndDownload\}[^>]*>[\s\S]*?<\/button>/);
    if (saveBtnMatch) {
        const btnText = saveBtnMatch[0];
        const newButtons = 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <button onClick={() => handleSaveAndDownload(false)} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                          {isSaving && !showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                          {isSaving && !showEmailModal ? 'Generando Excel...' : 'Finalizar y Descargar'}
                      </button>
                      <button onClick={() => setShowEmailModal(true)} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                          {isSaving && showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Mail size={22} />}
                          {isSaving && showEmailModal ? 'Generando y Enviando...' : 'Enviar por Correo'}
                      </button>
                  </div>
                  
                  <EmailReportModal 
                      isOpen={showEmailModal} 
                      onClose={() => setShowEmailModal(false)}
                      isSending={isSaving}
                      onSend={async (data) => {
                          await handleSaveAndDownload(true, data);
                          setShowEmailModal(false);
                      }}
                  />;
        content = content.replace(btnText, newButtons);
    }

    fs.writeFileSync(path.join(dir, file), content);
    console.log('Patched ' + file);
});
