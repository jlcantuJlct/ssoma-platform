const fs = require('fs');

let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const clearDraftHandler = `
    const handleClearDraft = async () => {
        if (!templateFile) return;
        const confirmClear = window.confirm('¿Estás seguro de que quieres limpiar todo el borrador para iniciar un nuevo mes? Esto no se puede deshacer.');
        if (!confirmClear) return;
        
        const docType = templateFile.name;
        setStatus({ stage: 'loading', message: '🧹 Limpiando borrador...', progress: 50 });
        try {
            await fetch(\`/api/draft?docType=\${docType}\`, { method: 'DELETE' });
            
            // Reload clean template
            if (docType === 'PAD_SAN_CLEMENTE_INTERNAL.docx') {
                loadSanClemente();
            } else if (docType === 'PAD_CHINCHAYSULLO_INTERNAL.docx') {
                loadChinchaysullo();
            } else if (docType === 'PAD_JAHUAY_INTERNAL.docx') {
                loadJahuay();
            } else if (docType === 'PAD_BARANDAS_INTERNAL.docx') {
                loadBarandas();
            } else {
                setTags([]);
                setStatus({ stage: 'ready', message: 'Borrador limpiado. Puedes cargar una nueva plantilla.', progress: 100 });
            }
        } catch (e) {
            setStatus({ stage: 'error', message: 'Error al limpiar borrador', progress: 0 });
        }
    };
`;
code = code.replace('    const handleGenerate = async () => {', clearDraftHandler + '\n    const handleGenerate = async () => {');

const buttonsHtml = `
                            {status.stage === 'generating' ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <FileCheck size={20} />
                                    Generar Documento
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={handleClearDraft}
                            disabled={status.stage === 'generating'}
                            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60 mt-4"
                            style={{
                                background: 'hsl(348,83%,25%)',
                                border: '1px solid hsl(348,83%,35%)'
                            }}
                        >
                            <Trash2 size={20} />
                            Empezar Nuevo Mes (Limpiar Todo)
                        </button>
`;

code = code.replace(/\{status\.stage === 'generating' \? \([^)]+\) : \([^)]+\)\}\s*<\/button>/s, buttonsHtml);

fs.writeFileSync('app/generador-informes/page.tsx', code, 'utf8');
