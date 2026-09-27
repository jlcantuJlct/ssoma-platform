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
    const [evidencia, setEvidencia] = useState('');
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [done, setDone] = useState(false);
    const [driveUrl, setDriveUrl] = useState('');

    useEffect(() => {
        if (!token) return;
        fetch(`/api/levantamiento/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) setFinding(data.finding);
                else setError(data.error || 'Enlace inválido');
                setLoading(false);
            })
            .catch(() => { setError('Error de conexión. Intenta de nuevo.'); setLoading(false); });
    }, [token]);

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                setEvidencia(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = event.target.result as string;
        };
        reader.readAsDataURL(file);
    };

    const levantar = async () => {
        if (!evidencia) {
            alert('Debe subir la evidencia fotográfica del levantamiento.');
            return;
        }
        setEnviando(true);
        try {
            const res = await fetch(`/api/levantamiento/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evidence: evidencia, comentario }),
            });
            const data = await res.json();
            if (data.success) {
                setDone(true);
                setDriveUrl(data.driveUrl || '');
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

    // ÉXITO: observación levantada (o ya estaba levantada)
    if (done || finding.status === 'Cerrado') {
        return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
                        <CheckCircle className="text-emerald-500 mx-auto mb-4" size={56} />
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Observación Levantada!</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.
                        </p>
                        
                        {(evidencia || finding.evidenciaLevantamiento) && (
                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Evidencia Registrada:</p>
                                <img 
                                    src={evidencia || finding.evidenciaLevantamiento} 
                                    alt="Evidencia levantada" 
                                    className="rounded-lg w-full max-h-48 object-cover border border-slate-200 mb-3" 
                                />
                                {(comentario || finding.comentario) && (
                                    <>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1 mt-3">Comentario adjunto:</p>
                                        <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{comentario || finding.comentario}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {driveUrl && (
                            <a href={driveUrl} target="_blank" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1.5 justify-center w-full bg-blue-50 py-3 rounded-xl border border-blue-100">
                                📄 Ver reporte actualizado
                            </a>
                        )}
                    </div>
                </div>
            );
    }

    // FORMULARIO DE LEVANTAMIENTO
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
                        {/* Detalle del hallazgo */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                            <p className="text-slate-800 font-semibold mb-2">{finding.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className={`px-3 py-1 rounded-full border font-bold ${riesgoColor(finding.riesgo)}`}>
                                    Riesgo: {finding.riesgo || '-'}
                                </span>
                                {finding.categoria && (
                                    <span className="px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 font-semibold">
                                        {finding.categoria}
                                    </span>
                                )}
                                {finding.fechaProg && (
                                    <span className="px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 font-semibold">
                                        Fecha programada: {finding.fechaProg}
                                    </span>
                                )}
                            </div>
                            {finding.evidencia && (
                                <div className="mt-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Evidencia inicial:</p>
                                    <img src={finding.evidencia} alt="Evidencia inicial" className="rounded-lg max-h-48 object-cover border border-slate-200" />
                                </div>
                            )}
                        </div>

                        {/* Subir evidencia de levantamiento */}
                        <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia del levantamiento (foto) *</label>
                        <div
                            className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-emerald-400 transition-colors mb-4"
                            onClick={() => document.getElementById('foto-levantamiento')?.click()}
                        >
                            {evidencia ? (
                                <img src={evidencia} alt="Evidencia de levantamiento" className="h-full w-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <Camera size={36} />
                                    <span className="text-sm font-bold">Toca para subir la foto</span>
                                </div>
                            )}
                            <input id="foto-levantamiento" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
                        </div>

                        {/* Comentario */}
                        <label className="block text-sm font-bold text-slate-700 mb-2">Comentario de la acción realizada:</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-xl p-3 h-24 resize-none mb-6"
                            placeholder="Describe cómo se corrigió o levantó la observación..."
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                        />

                        <button
                            onClick={levantar}
                            disabled={enviando}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
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
