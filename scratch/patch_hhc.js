const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
    'import { useState, useEffect, useMemo } from "react";',
    'import { useState, useEffect, useMemo, useRef } from "react";'
);
content = content.replace(
    'import { TrendingUp, Target, Award, ShieldCheck, Activity as ActivityIcon, Leaf, Users, Clock, Calculator, HardHat, Trash2, Edit, History, Plus, PlusCircle, PieChart as PieChartIcon, CheckCircle2 } from \'lucide-react\';',
    'import { TrendingUp, Target, Award, ShieldCheck, Activity as ActivityIcon, Leaf, Users, Clock, Calculator, HardHat, Trash2, Edit, History, Plus, PlusCircle, PieChart as PieChartIcon, CheckCircle2, UploadCloud, Loader2 } from \'lucide-react\';'
);

// 2. Add state inside component
const stateCode = `
    const [monthlyTemarioUrl, setMonthlyTemarioUrl] = useState<string | null>(null);
    const [isUploadingTemario, setIsUploadingTemario] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === 'hhc') {
            fetch(\`/api/monthly-temarios?month=\${hhcMonthFilter}&year=\${currentYear}\`)
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
        }
    }, [mode, hhcMonthFilter, currentYear]);

    const handleUploadTemario = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingTemario(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', \`Temarios_Mensuales/\${currentYear}/\${hhcMonthFilter}\`);
        formData.append('fileName', \`Temario_\${MONTHS[hhcMonthFilter]}_\${currentYear}.pdf\`);

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
                    body: JSON.stringify({ month: hhcMonthFilter, year: currentYear, url: driveUrl })
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

content = content.replace(
    '// --- STATE FOR NEW HHC INDEX LOGIC ---',
    stateCode + '\n    // --- STATE FOR NEW HHC INDEX LOGIC ---'
);


// 3. UI placement
const uiCode = `
                        {/* AQUI AGREGAMOS EL BOTÓN DE TEMARIO MENSUAL */}
                        <div className="flex items-center gap-3">
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleUploadTemario} 
                            />
                            {monthlyTemarioUrl ? (
                                <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-indigo-500/50 shadow-inner">
                                    <a href={monthlyTemarioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white hover:text-indigo-200 font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                                        <FileText size={16} /> Ver Temario Mensual
                                    </a>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={isUploadingTemario}
                                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                        title="Reemplazar PDF"
                                    >
                                        <UploadCloud size={16} className={isUploadingTemario ? "animate-pulse text-indigo-400" : ""} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingTemario}
                                    className="flex items-center gap-2 text-xs text-white font-bold px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploadingTemario ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} className="text-indigo-400" />}
                                    {isUploadingTemario ? "Subiendo..." : "Cargar Temario (PDF)"}
                                </button>
                            )}
                        </div>
`;

content = content.replace(
    '<p className="text-xs text-slate-400 font-medium">Gestión de Horas Hombre Capacitadas e Indicadores</p>\r\n                            </div>\r\n                        </div>',
    '<p className="text-xs text-slate-400 font-medium">Gestión de Horas Hombre Capacitadas e Indicadores</p>\n                            </div>\n                        </div>\n' + uiCode
);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified DashboardCharts.tsx successfully!');
