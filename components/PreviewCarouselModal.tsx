import React, { useState } from 'react';
import { 
    FileText, 
    FileSpreadsheet, 
    Image as ImageIcon, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    FileEdit,
    Edit,
    X,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw
} from 'lucide-react';
import { getDriveViewerUrl } from '@/lib/utils';

interface PreviewCarouselModalProps {
    urls: string[];
    onClose: () => void;
    onEdit?: () => void;
    canEdit?: boolean;
    filename?: string;
}

const ZOOM_STEPS = [0.5, 0.65, 0.75, 0.85, 1, 1.15, 1.3, 1.5, 1.75, 2];
const DEFAULT_ZOOM_INDEX = 4; // 1.0 = 100%

export default function PreviewCarouselModal({ 
    urls, 
    onClose, 
    onEdit, 
    canEdit = false,
    filename = "Documento adjunto"
}: PreviewCarouselModalProps) {
    const [previewIndex, setPreviewIndex] = useState(0);
    const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);

    if (!urls || urls.length === 0) return null;

    const currentUrl = urls[previewIndex] || urls[0];
    const zoom = ZOOM_STEPS[zoomIndex];
    
    const isPdf = currentUrl.toLowerCase().match(/\.pdf$/i);
    const isWord = currentUrl.toLowerCase().match(/\.(doc|docx)$/i);
    const isExcel = currentUrl.toLowerCase().match(/\.(xls|xlsx)$/i);

    const zoomIn  = () => setZoomIndex(i => Math.min(i + 1, ZOOM_STEPS.length - 1));
    const zoomOut = () => setZoomIndex(i => Math.max(i - 1, 0));
    const resetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

    const handlePrev = () => { setPreviewIndex(prev => prev > 0 ? prev - 1 : urls.length - 1); resetZoom(); };
    const handleNext = () => { setPreviewIndex(prev => prev < urls.length - 1 ? prev + 1 : 0); resetZoom(); };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* ── CABECERA ── */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                {isPdf  ? <FileText size={20} className="text-red-400" /> : 
                                 isWord  ? <FileEdit size={20} className="text-blue-400" /> :
                                 isExcel ? <FileSpreadsheet size={20} className="text-emerald-400" /> :
                                           <ImageIcon size={20} className="text-blue-400" />}
                                Vista Previa
                                {urls.length > 1 && (
                                    <span className="text-slate-400 text-sm ml-2 font-normal">
                                        (Archivo {previewIndex + 1} de {urls.length})
                                    </span>
                                )}
                            </h3>
                            {canEdit && onEdit && (
                                <button 
                                    onClick={() => { onEdit(); onClose(); }}
                                    className="ml-4 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase transition-colors border border-amber-500/20 flex items-center gap-2"
                                >
                                    <Edit size={14} /> Cambiar Evidencia
                                </button>
                            )}
                        </div>
                        {filename && (
                            <div className="text-xs text-slate-400 ml-7">
                                <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {filename}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Navegación multi-archivo */}
                        {urls.length > 1 && (
                            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button onClick={handlePrev} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors" title="Anterior">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={handleNext} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors" title="Siguiente">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        {/* ── CONTROLES DE ZOOM ── */}
                        <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                            <button
                                onClick={zoomOut}
                                disabled={zoomIndex === 0}
                                title="Reducir"
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ZoomOut size={16} />
                            </button>

                            {/* Indicador de zoom — click resetea */}
                            <button
                                onClick={resetZoom}
                                title="Restablecer zoom (100%)"
                                className={`px-2 py-0.5 rounded text-[10px] font-black tabular-nums transition-colors min-w-[42px] text-center ${
                                    zoomIndex === DEFAULT_ZOOM_INDEX
                                        ? 'text-slate-500 hover:text-slate-300'
                                        : 'text-indigo-400 hover:text-indigo-300'
                                }`}
                            >
                                {Math.round(zoom * 100)}%
                            </button>

                            <button
                                onClick={zoomIn}
                                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                                title="Ampliar"
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ZoomIn size={16} />
                            </button>

                            {/* Ajustar a pantalla */}
                            <button
                                onClick={resetZoom}
                                title="Ajustar a pantalla"
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors border-l border-slate-800 ml-1"
                            >
                                <Maximize2 size={14} />
                            </button>
                        </div>

                        {/* Descargar */}
                        <a
                            href={currentUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                            title="Descargar este archivo"
                        >
                            <Download size={18} /> Descargar
                        </a>

                        <button onClick={onClose} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors ml-1">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* ── ÁREA DE PREVISUALIZACIÓN ── */}
                <div className="w-full h-[75vh] overflow-auto bg-slate-950 relative group" style={{ scrollbarGutter: 'stable' }}>
                    {/* Botones de flecha laterales (multi-archivo) */}
                    {urls.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Contenedor con zoom aplicado */}
                    <div
                        style={{
                            transformOrigin: 'top center',
                            transform: `scale(${zoom})`,
                            width: zoom < 1 ? `${100 / zoom}%` : '100%',
                            height: zoom < 1 ? `${100 / zoom}%` : '100%',
                            transition: 'transform 0.2s ease',
                        }}
                    >
                        <iframe 
                            key={currentUrl}
                            src={getDriveViewerUrl(currentUrl, false)} 
                            className="w-full h-full min-h-[60vh] rounded-lg border border-slate-800 shadow-2xl bg-slate-950" 
                            title="File Preview"
                        />
                    </div>
                </div>

                {/* ── BARRA DE ESTADO INFERIOR ── */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-900/60">
                    <p className="text-[10px] text-slate-500">
                        💡 Si el documento se ve muy grande o pequeño, usa los controles de zoom <strong className="text-slate-400">– / +</strong> en la barra superior.
                    </p>
                    {zoom !== 1 && (
                        <button
                            onClick={resetZoom}
                            className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                        >
                            <RotateCcw size={11} /> Restablecer zoom
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
