const fs = require('fs');
const file_path = "app/gestion-residuos/page.tsx";
let content = fs.readFileSync(file_path, "utf-8");

// Fix Desconocido mapping
content = content.replace(
    "documentType: r.certType || r.documentType || 'Desconocido'",
    "documentType: r.cert_type || r.certType || r.documentType || 'Desconocido'"
);

// Fix multiple files rendering
const oldButtons = `                                                <div className="flex gap-1 shrink-0 ml-2">
                                                    <button 
                                                        onClick={() => window.open(getDriveViewerUrl(rec.fileUrls && rec.fileUrls[0]), '_blank')}
                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                                        title="Ver Documento"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <a 
                                                        href={getDriveDownloadUrl(rec.fileUrls && rec.fileUrls[0])}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all flex items-center justify-center"
                                                        title="Descargar ZIP"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                    <button 
                                                        onClick={() => exportRecordToPDF('Gestión de Residuos', rec, \`Gestion_Residuos_\${rec.date}.pdf\`)}
                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center"
                                                        title="Descargar PDF"
                                                    >
                                                        <DownloadCloud size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(rec.id)}
                                                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>`;

const newButtons = `                                                <div className="flex gap-1 shrink-0 ml-2">
                                                    <button 
                                                        onClick={() => exportRecordToPDF('Gestión de Residuos', rec, \`Gestion_Residuos_\${rec.date}.pdf\`)}
                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center"
                                                        title="Descargar Fila en PDF"
                                                    >
                                                        <DownloadCloud size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(rec.id)}
                                                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>`;

content = content.replace(oldButtons, newButtons);

const oldZona = `                                            <div className="pt-2 border-t border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Zona / Proyecto</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.zona}</p>
                                            </div>`;

const newZona = `                                            <div className="pt-2 border-t border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Zona / Proyecto</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.zona}</p>
                                            </div>
                                            {rec.fileUrls && rec.fileUrls.length > 0 && (
                                                <div className="pt-2 mt-2 border-t border-slate-800/50">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Archivos Adjuntos ({rec.fileUrls.length})</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rec.fileUrls.map((url: string, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                                                                <span className="text-[10px] font-bold text-slate-400">Arch. {idx + 1}</span>
                                                                <button 
                                                                    onClick={() => window.open(getDriveViewerUrl(url), '_blank')}
                                                                    className="p-1 hover:text-emerald-400 text-slate-500 transition-colors"
                                                                    title="Ver"
                                                                >
                                                                    <FileText size={12} />
                                                                </button>
                                                                <a 
                                                                    href={getDriveDownloadUrl(url)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                                                                    title="Descargar"
                                                                >
                                                                    <Download size={12} />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}`;

content = content.replace(oldZona, newZona);

fs.writeFileSync(file_path, content);
console.log("Done");
