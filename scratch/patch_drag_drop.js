const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add isDraggingTemario state
content = content.replace(
    'const [isUploadingTemario, setIsUploadingTemario] = useState(false);',
    'const [isUploadingTemario, setIsUploadingTemario] = useState(false);\n    const [isDraggingTemario, setIsDraggingTemario] = useState(false);'
);


// 2. Refactor upload logic and add drag handlers
const uploadLogicStr = `const handleUploadTemario = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingTemario(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', \`Temarios_Mensuales/\${currentYear}/\${programMonthFilter}\`);
        formData.append('fileName', \`Temario_\${MONTHS[programMonthFilter]}_\${currentYear}.pdf\`);

        try {
            const uploadRes = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success || uploadData.path) {
                const driveUrl = uploadData.path;
                const saveRes = await fetch('/api/monthly-temarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ month: programMonthFilter, year: currentYear, url: driveUrl })
                });
                const saveData = await saveRes.json();
                
                if (saveData.success) {
                    setMonthlyTemarioUrl(driveUrl);
                    alert('✅ Temario mensual subido y guardado exitosamente.');
                } else {
                    alert('⚠️ Error al guardar la URL del temario: ' + saveData.error);
                }
            } else {
                alert('⚠️ Error subiendo el PDF a Drive: ' + uploadData.error);
            }
        } catch (err) {
            console.error(err);
            alert('⚠️ Error de conexión.');
        } finally {
            setIsUploadingTemario(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };`;

const newUploadLogicStr = `const processTemarioUpload = async (file: File) => {
        setIsUploadingTemario(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', \`Temarios_Mensuales/\${currentYear}/\${programMonthFilter}\`);
        formData.append('fileName', \`Temario_\${MONTHS[programMonthFilter]}_\${currentYear}.pdf\`);

        try {
            const uploadRes = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success || uploadData.path) {
                const driveUrl = uploadData.path;
                const saveRes = await fetch('/api/monthly-temarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ month: programMonthFilter, year: currentYear, url: driveUrl })
                });
                const saveData = await saveRes.json();
                
                if (saveData.success) {
                    setMonthlyTemarioUrl(driveUrl);
                    alert('✅ Temario mensual subido y guardado exitosamente.');
                } else {
                    alert('⚠️ Error al guardar la URL del temario: ' + saveData.error);
                }
            } else {
                alert('⚠️ Error subiendo el PDF a Drive: ' + uploadData.error);
            }
        } catch (err) {
            console.error(err);
            alert('⚠️ Error de conexión.');
        } finally {
            setIsUploadingTemario(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUploadTemario = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processTemarioUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            processTemarioUpload(file);
        } else if (file) {
            alert("⚠️ Solo se permiten archivos en formato PDF.");
        }
    };`;

content = content.replace(uploadLogicStr, newUploadLogicStr);


// 3. Update the UI for Cargar Temario button
const oldButtonUI = `<button 
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isUploadingTemario}
                                                            className="flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 hover:border-indigo-500/60 rounded transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                                                        >
                                                            {isUploadingTemario ? <Loader2 className="animate-spin" size={12} /> : <UploadCloud size={12} className="text-indigo-400" />}
                                                            {isUploadingTemario ? "Cargando..." : "Cargar Temario"}
                                                        </button>`;

const newButtonUI = `<div 
                                                            onDragOver={handleDragOver}
                                                            onDragLeave={handleDragLeave}
                                                            onDrop={handleDrop}
                                                            className={\`flex items-center transition-all \${isDraggingTemario ? 'scale-105 opacity-90' : ''}\`}
                                                        >
                                                            <button 
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploadingTemario}
                                                                className={\`flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border \${isDraggingTemario ? 'border-emerald-500 shadow-emerald-500/50' : 'border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10'} rounded transition-all shadow-lg disabled:opacity-50\`}
                                                            >
                                                                {isUploadingTemario ? <Loader2 className="animate-spin" size={12} /> : <UploadCloud size={12} className={isDraggingTemario ? "text-emerald-400" : "text-indigo-400"} />}
                                                                {isUploadingTemario ? "Cargando..." : (isDraggingTemario ? "Suelta el PDF aquí" : "Cargar Temario")}
                                                            </button>
                                                        </div>`;

content = content.replace(oldButtonUI, newButtonUI);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified DashboardCharts.tsx to add drag and drop successfully!');
