
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Loader2, Camera, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';

type Finding = {
    moduleName: string;
    description: string;
    riesgo: string;
    categoria: string;
    responsable: string;
    responsableEmail: string;
    fechaProg: string;
    status: string;
    evidencia: string;
    evidenciaLevantamiento?: string;
    comentario: string;
    closedAt: string | null;
    fotosDefectos?: Record<string, string[]>;
};

const riesgoColor = (r: string) => {
    if (r === 'Bajo') return 'bg-green-100 text-green-800 border-green-300';
    if (r === 'Medio') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (r === 'Alto') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-slate-100 text-slate-600 border-slate-300';
};

export default function LevantamientoPublico() {
    const params = useParams();
    const token = params?.token as string;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [finding, setFinding] = useState<Finding | null>(null);
    const [evidencia, setEvidencia] = useState(''); // Retrocompatibilidad
    const [evidenciasMap, setEvidenciasMap] = useState<Record<string, string>>({});
    const [comentariosMap, setComentariosMap] = useState<Record<string, string>>({});
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [done, setDone] = useState(false);
    const [isParcialState, setIsParcialState] = useState(false);
    const [driveUrl, setDriveUrl] = useState('');
    const [fileBase64, setFileBase64] = useState('');
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch(`/api/levantamiento/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setFinding(data.finding);
                    if (data.finding.driveUrl) setDriveUrl(data.finding.driveUrl);
                    
                    const splitted = (data.finding.description || "").split('\n').filter(l => l.trim().length > 0);
                    
                    if (data.finding.evidenciaLevantamiento && data.finding.evidenciaLevantamiento.startsWith('{')) {
                        try {
                            setEvidenciasMap(JSON.parse(data.finding.evidenciaLevantamiento));
                        } catch(e){}
                    }
                    if (data.finding.comentario && data.finding.comentario.startsWith('{')) {
                        try { setComentariosMap(JSON.parse(data.finding.comentario)); } catch(e){}
                    } else if (data.finding.comentario && data.finding.comentario.includes(': ')) {
                        try {
                            const cMap = {};
                            data.finding.comentario.split('\n').forEach(line => {
                                const parts = line.split(': ');
                                if (parts.length > 1) {
                                    // fuzzy match key if the original line had a colon
                                    const val = parts.slice(1).join(': ');
                                    const matchingLine = splitted.find(l => l.startsWith(parts[0]));
                                    if (matchingLine) cMap[matchingLine] = val;
                                }
                            });
                            setComentariosMap(cMap);
                        } catch(e){}
                    }
                    if (splitted.length > 0 && (data.finding.moduleName.toLowerCase().includes('almacen') || data.finding.moduleName.toLowerCase().includes('taller') || data.finding.moduleName.toLowerCase().includes('campamento') || data.finding.moduleName.toLowerCase().includes('eléctrica') || data.finding.moduleName.toLowerCase().includes('electrica') || data.finding.moduleName.toLowerCase().includes('cocina') || data.finding.moduleName.toLowerCase().includes('comedor') || data.finding.moduleName.toLowerCase().includes('laboratorio') || data.finding.moduleName.toLowerCase().includes('botiquin') || data.finding.moduleName.toLowerCase().includes('botiquín'))) {
                        setLines(splitted);
                    } else {
                        setLines([data.finding.description]);
                    }
                }
                else setError(data.error || 'Enlace inválido');
                setLoading(false);
            })
            .catch(() => { setError('Error de conexión. Intenta de nuevo.'); setLoading(false); });
    }, [token]);

    const handleFotoMulti = (e: React.ChangeEvent<HTMLInputElement>, line: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) return;
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
                else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const b64 = canvas.toDataURL('image/jpeg', 0.6);
                setEvidenciasMap(prev => ({ ...prev, [line]: b64 }));
                // Si es solo uno, usar el antiguo también para retrocompatibilidad
                if (lines.length === 1) setEvidencia(b64); 
            };
            img.src = event.target.result as string;
        };
        reader.readAsDataURL(file);
    };

    const levantar = async () => {
        if (lines.length > 1) {
            if (Object.keys(evidenciasMap).length === 0) {
                alert('Debe subir al menos una evidencia fotográfica de levantamiento.');
                return;
            }
        } else {
            if (!evidencia && Object.keys(evidenciasMap).length === 0) {
                alert('Debe subir la evidencia fotográfica del levantamiento.');
                return;
            }
        }
        
        setEnviando(true);
        try {
            const finalEvidencia = lines.length > 1 ? JSON.stringify(evidenciasMap) : (evidencia || evidenciasMap[lines[0]]);
            const finalComentario = lines.length > 1 ? JSON.stringify(comentariosMap) : comentario;
            
            const res = await fetch(`/api/levantamiento/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evidence: finalEvidencia, comentario: finalComentario }),
            });
            const data = await res.json();
            if (data.success) {
                setIsParcialState(data.isParcial);
                setDone(true);
                setDriveUrl(data.driveUrl || '');
                setFileBase64(data.fileBase64 || '');
            } else {
                alert(data.error || 'Error al levantar la observación.');
            }
        } catch (e) {
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={28} /> Cargando...
                </div>
            </div>
        );
    }

    if (error || !finding) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <XCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Enlace no válido</h1>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (done || finding.status === 'Cerrado') {
        return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
                        <CheckCircle className="text-emerald-500 mx-auto mb-4" size={56} />
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">
                        {isParcialState ? '¡Avance Guardado!' : '¡Observación Levantada!'}
                    </h1>
                    <p className="text-slate-500 mb-6 text-sm">
                        {isParcialState 
                            ? 'Tu evidencia parcial fue registrada en el Excel. Puedes cerrar esta pestaña y volver a usar tu enlace luego para completar las observaciones restantes.' 
                            : 'Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.'}
                    </p>
                        
                        {(evidencia || (finding.evidenciaLevantamiento && !finding.evidenciaLevantamiento.startsWith('{'))) && (
                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Evidencia Registrada:</p>
                                <img 
                                    src={evidencia || finding.evidenciaLevantamiento} 
                                    alt="Evidencia levantada" 
                                    className="rounded-lg w-full max-h-48 object-cover border border-slate-200 mb-3" 
                                />
                            </div>
                        )}

                        {driveUrl && (
                            <a href={driveUrl} target="_blank" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1.5 justify-center w-full bg-blue-50 py-3 rounded-xl border border-blue-100 mb-3">
                                📄 Ver reporte actualizado
                            </a>
                        )}
                        {fileBase64 && (
                            <button onClick={() => {
                                const link = document.createElement('a');
                                link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + fileBase64;
                                link.download = 'Reporte_Levantamiento.xlsx';
                                link.click();
                            }} className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5 justify-center w-full bg-emerald-50 py-3 rounded-xl border border-emerald-100 mb-3">
                                ⬇️ Descargar Excel
                            </button>
                        )}
                        <button onClick={() => { window.close(); setTimeout(() => { window.location.href = '/'; }, 300); }} className="text-slate-600 font-bold hover:underline inline-flex items-center gap-1.5 justify-center w-full bg-slate-100 hover:bg-slate-200 py-3 rounded-xl border border-slate-200 transition-colors">
                            Guardar y Cerrar
                        </button>
                    </div>
                </div>
            );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-6 text-white">
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                            <ShieldCheck size={28} /> Levantamiento de Observación
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1">
                            Hola {finding.responsable}, se te asignó cerrar la siguiente observación de <b>{finding.moduleName}</b>.
                        </p>
                    </div>

                    <div className="p-6">
                        
                        {lines.map((line, idx) => (
                            <div key={idx} className="mb-8 border-b pb-6 border-slate-200 last:border-0 last:pb-0">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                                    <p className="text-slate-800 font-semibold mb-2 whitespace-pre-wrap">{line}</p>
                                    {idx === 0 && (
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className={`px-3 py-1 rounded-full border font-bold ${riesgoColor(finding.riesgo)}`}>
                                                Riesgo: {finding.riesgo || '-'}
                                            </span>
                                            {finding.fechaProg && (
                                                <span className="px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 font-semibold">
                                                    Fecha programada: {finding.fechaProg}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    
                                    {/* Left side: Original photo (if exists) */}
                                    {(() => {
                                        const matchKey = Object.keys(finding.fotosDefectos || {}).find(k => line.replace(/[\u200B]/g, '').trim().startsWith(k.replace(/[\u200B]/g, '').trim()));
                                        const origPhotos = matchKey ? finding.fotosDefectos[matchKey] : [];
                                        if (origPhotos && origPhotos.length > 0) {
                                            return (
                                                <div className="w-full md:w-1/2">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Condición observada</p>
                                                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                                        {origPhotos.map((p, i) => (
                                                            <img key={i} src={p} className="h-32 w-auto rounded-lg border border-slate-200 object-cover flex-shrink-0 snap-center shadow-sm" alt="Foto inicial" />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Right side: Upload Levantamiento */}
                                    <div className="w-full flex-1">
                                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1"><Camera size={14}/> Foto del Levantamiento *</p>
                                        
                                        {evidenciasMap[line] || (lines.length === 1 && evidencia) ? (
                                            <div className="relative h-32 mb-2 border-2 border-emerald-400 rounded-xl overflow-hidden shadow-sm">
                                                <img src={evidenciasMap[line] || evidencia} alt="Evidencia" className="h-full w-full object-cover" />
                                                <div className="absolute bottom-2 right-2 flex gap-1.5">
                                                    <button type="button" onClick={() => document.getElementById('foto-levantamiento-' + idx)?.click()} className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 hover:bg-slate-50">🔄 Cambiar</button>
                                                    <button type="button" onClick={() => {
                                                        setEvidenciasMap(p => { const n = {...p}; delete n[line]; return n; });
                                                        if (lines.length === 1) setEvidencia('');
                                                    }} className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 hover:bg-red-600">🗑️ Quitar</button>
                                                </div>
                                                <input id={'foto-levantamiento-' + idx} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFotoMulti(e, line)} />
                                            </div>
                                        ) : (
                                            <div
                                                className="h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors mb-2"
                                                onClick={() => document.getElementById('foto-levantamiento-' + idx)?.click()}
                                            >
                                                <div className="text-slate-400 flex flex-col items-center gap-1">
                                                    <Camera size={28} className="opacity-60" />
                                                    <span className="text-xs font-bold">Toca para tomar foto</span>
                                                </div>
                                                <input id={'foto-levantamiento-' + idx} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFotoMulti(e, line)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <label className="block text-sm font-bold text-slate-700 mb-2">Comentario de corrección:</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-xl p-3 h-20 resize-none"
                                    placeholder="Describe la acción realizada..."
                                    value={lines.length > 1 ? (comentariosMap[line] || "") : comentario}
                                    onChange={(e) => {
                                        if (lines.length > 1) setComentariosMap(prev => ({...prev, [line]: e.target.value}));
                                        else setComentario(e.target.value);
                                    }}
                                />
                            </div>
                        ))}

                        <button
                            onClick={levantar}
                            disabled={enviando}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 mt-6"
                        >
                            {enviando ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle size={22} />}
                            Levantar Observación
                        </button>
                    </div>
                </div>
                <p className="text-center text-slate-400 text-xs mt-4 flex items-center justify-center gap-1">
                    <AlertTriangle size={12} /> Enlace seguro y privado — solo tú puedes ver esta observación.
                </p>
            </div>
        </div>
    );
}
