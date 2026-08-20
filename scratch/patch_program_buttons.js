const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add handleDeleteTemario function right after handleUploadTemario
const deleteHandlerCode = `
    const handleDeleteTemario = async () => {
        if (!window.confirm('¿Estás seguro de ELIMINAR el temario de este mes?')) return;
        
        try {
            const res = await fetch(\`/api/monthly-temarios?month=\${programMonthFilter}&year=\${currentYear}\`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setMonthlyTemarioUrl(null);
                alert('✅ Temario eliminado correctamente.');
            } else {
                alert('⚠️ Error al eliminar el temario.');
            }
        } catch (err) {
            console.error(err);
            alert('⚠️ Error de conexión al intentar eliminar.');
        }
    };
`;

content = content.replace(
    'if (fileInputRef.current) fileInputRef.current.value = \'\';\n        }\n    };',
    'if (fileInputRef.current) fileInputRef.current.value = \'\';\n        }\n    };\n' + deleteHandlerCode
);


// Replace the old UI block with the new one that has Ver, Descargar, Actualizar, Eliminar
const oldUI = `                                                    {monthlyTemarioUrl ? (
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
                                                    ) : (`;

const newUI = `                                                    {monthlyTemarioUrl ? (
                                                        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-indigo-500/50 shadow-inner">
                                                            {/* VER */}
                                                            <a href={monthlyTemarioUrl} target="_blank" rel="noopener noreferrer" title="Ver Temario" className="flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-lg shadow-indigo-500/20">
                                                                <Eye size={12} /> Ver
                                                            </a>
                                                            
                                                            {/* DESCARGAR */}
                                                            <a href={monthlyTemarioUrl.replace('/view?usp=drivesdk', '/export?format=pdf').replace('/view', '/export?format=pdf')} target="_blank" rel="noopener noreferrer" title="Descargar PDF" className="text-slate-400 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-700 transition-colors">
                                                                <Download size={12} />
                                                            </a>

                                                            {/* ACTUALIZAR */}
                                                            <button 
                                                                onClick={() => fileInputRef.current?.click()} 
                                                                disabled={isUploadingTemario}
                                                                className="text-slate-400 hover:text-blue-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                                                                title="Actualizar Temario"
                                                            >
                                                                <UploadCloud size={12} className={isUploadingTemario ? "animate-pulse" : ""} />
                                                            </button>

                                                            {/* ELIMINAR */}
                                                            <button 
                                                                onClick={handleDeleteTemario} 
                                                                disabled={isUploadingTemario}
                                                                className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                                                                title="Eliminar Temario"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (`

content = content.replace(oldUI, newUI);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified DashboardCharts.tsx to add new buttons successfully!');
