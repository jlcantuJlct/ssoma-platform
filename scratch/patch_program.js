const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove old Temario state logic from HHC section
const oldStateRegex = /\/\/ --- TEMARIO MENSUAL LOGIC ---[\s\S]*?(?=\/\/ Store manually input HHT, Empleados, Obreros per month)/;
content = content.replace(oldStateRegex, '');

// 2. Remove old Temario UI from HHC section
const oldUIRegex = /\{\/\* AQUI AGREGAMOS EL BOTÓN DE TEMARIO MENSUAL \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* 1\. KPIs RESUMEN/;
content = content.replace(oldUIRegex, '</div>\n\n                    {/* 1. KPIs RESUMEN');


// 3. Insert new Temario State Logic near programMonthFilter
const newStateCode = `
    // --- TEMARIO MENSUAL LOGIC (PROGRAMA) ---
    const [monthlyTemarioUrl, setMonthlyTemarioUrl] = useState<string | null>(null);
    const [isUploadingTemario, setIsUploadingTemario] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(\`/api/monthly-temarios?month=\${programMonthFilter}&year=\${currentYear}\`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMonthlyTemarioUrl(data.url);
                } else {
                    setMonthlyTemarioUrl(null);
                }
            })
            .catch(err => {
                console.error("Error fetching temario:", err);
                setMonthlyTemarioUrl(null);
            });
    }, [programMonthFilter, currentYear]);

    const handleUploadTemario = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };
`;
// Insert after programMonthFilter declaration
content = content.replace(
    'const [programMonthFilter, setProgramMonthFilter] = useState<number>(new Date().getMonth());',
    'const [programMonthFilter, setProgramMonthFilter] = useState<number>(new Date().getMonth());\n' + newStateCode
);


// 4. Insert UI in Programa Mensual modal
const newUICode = `
                                                {/* BOTÓN DE TEMARIO MENSUAL (PROGRAMA) */}
                                                <div className="flex items-center ml-4 border-l border-slate-700 pl-4">
                                                    <input 
                                                        type="file" 
                                                        accept="application/pdf" 
                                                        className="hidden" 
                                                        ref={fileInputRef} 
                                                        onChange={handleUploadTemario} 
                                                    />
                                                    {monthlyTemarioUrl ? (
                                                        <div className="flex items-center gap-2">
                                                            <a href={monthlyTemarioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-white hover:text-indigo-200 font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-lg shadow-indigo-500/20">
                                                                <FileText size={12} /> Ver Temario (PDF)
                                                            </a>
                                                            <button 
                                                                onClick={() => fileInputRef.current?.click()} 
                                                                disabled={isUploadingTemario}
                                                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors"
                                                                title="Reemplazar PDF"
                                                            >
                                                                <UploadCloud size={14} className={isUploadingTemario ? "animate-pulse text-indigo-400" : ""} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isUploadingTemario}
                                                            className="flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 hover:border-indigo-500/60 rounded transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                                                        >
                                                            {isUploadingTemario ? <Loader2 className="animate-spin" size={12} /> : <UploadCloud size={12} className="text-indigo-400" />}
                                                            {isUploadingTemario ? "Cargando..." : "Cargar Temario"}
                                                        </button>
                                                    )}
                                                </div>
`;

content = content.replace(
    /<h4 className="text-sm font-bold text-blue-400">Actividades Programadas<\/h4>\s*\{\/\* FILTER CONTROLS \*\/\}\s*<div className="flex items-center gap-2">/,
    `<h4 className="text-sm font-bold text-blue-400">Actividades Programadas</h4>

                                                {/* FILTER CONTROLS */}
                                                <div className="flex items-center gap-2">` + newUICode
);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified DashboardCharts.tsx successfully!');
